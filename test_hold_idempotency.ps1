# Test script for hold idempotency implementation (PowerShell)
# Tests various edge cases to ensure holds are created/expired correctly

$BaseURL = "http://localhost:8080/api"
$UserId = 1
$Token = "eyJhbGciOiJIUzI1NiJ9..."  # Replace with valid JWT

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Hold Idempotency Test Suite" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Helper function to make authenticated API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "X-User-Id" = $UserId
        "Content-Type" = "application/json"
    }
    
    $uri = "$BaseURL$Endpoint"
    
    try {
        if ($null -eq $Body) {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody
        }
        return $response
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

# Test 1: Add item to cart
Write-Host ""
Write-Host "Test 1: Adding item to cart..." -ForegroundColor Yellow
$addItemResponse = Invoke-ApiCall -Method POST -Endpoint "/cart/items" -Body @{
    eventId = 1
    eventZoneId = 1
    qty = 2
    unitPrice = 50.00
}
Write-Host "Response: $($addItemResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray

# Get cart
Start-Sleep -Seconds 1
$cart = Invoke-ApiCall -Method GET -Endpoint "/cart"
$cartId = $cart.id
$itemId = $cart.items[0].id
Write-Host "Cart ID: $cartId, Item ID: $itemId" -ForegroundColor Green

# Test 2: Create initial hold
Write-Host ""
Write-Host "Test 2: Creating initial hold (qty=2)..." -ForegroundColor Yellow
$holdResponse1 = Invoke-ApiCall -Method POST -Endpoint "/cart/hold" -Body @{
    userId = $UserId
    cartId = $cartId
}
$holdId1 = $holdResponse1.holdId
Write-Host "Hold ID 1: $holdId1" -ForegroundColor Green
Write-Host "Expires At: $($holdResponse1.expiresAt)" -ForegroundColor Gray

# Test 3: Check database state
Write-Host ""
Write-Host "Test 3: Database state check point 1" -ForegroundColor Yellow
Write-Host "Expected: 1 PENDING hold with qty=2" -ForegroundColor Cyan
Write-Host "Run manually: SELECT * FROM reservation_hold WHERE user_id=$UserId ORDER BY id DESC LIMIT 5;" -ForegroundColor Gray

Start-Sleep -Seconds 2

# Test 4: Modify quantity
Write-Host ""
Write-Host "Test 4: Modifying quantity to 4..." -ForegroundColor Yellow
$updateResponse = Invoke-ApiCall -Method PATCH -Endpoint "/cart/items/$itemId" -Body @{
    qty = 4
}
Write-Host "Update Response: $($updateResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray

Start-Sleep -Seconds 1

# Test 5: Create hold again (should cleanup old hold)
Write-Host ""
Write-Host "Test 5: Creating hold after quantity change..." -ForegroundColor Yellow
$holdResponse2 = Invoke-ApiCall -Method POST -Endpoint "/cart/hold" -Body @{
    userId = $UserId
    cartId = $cartId
}
$holdId2 = $holdResponse2.holdId
Write-Host "Hold ID 2: $holdId2" -ForegroundColor Green
Write-Host "Expires At: $($holdResponse2.expiresAt)" -ForegroundColor Gray

# Test 6: Verify cleanup
Write-Host ""
Write-Host "Test 6: Verifying hold cleanup..." -ForegroundColor Yellow
Write-Host "Expected: Hold $holdId1 = EXPIRED, Hold $holdId2 = PENDING with qty=4" -ForegroundColor Cyan
Write-Host "⚠️  CRITICAL CHECK: Only ONE hold should be PENDING" -ForegroundColor Red

# Test 7: Rapid quantity changes (debounce test)
Write-Host ""
Write-Host "Test 7: Testing rapid quantity changes (debounce test)..." -ForegroundColor Yellow
Write-Host "Sending 5 rapid PATCH requests..." -ForegroundColor Gray

$jobs = @()
for ($i = 2; $i -le 6; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url, $itemId, $qty, $token, $userId)
        $headers = @{
            "Authorization" = "Bearer $token"
            "X-User-Id" = $userId
            "Content-Type" = "application/json"
        }
        Invoke-RestMethod -Uri "$url/cart/items/$itemId" -Method PATCH -Headers $headers -Body "{`"qty`":$qty}"
    } -ArgumentList $BaseURL, $itemId, $i, $Token, $UserId
}

$jobs | Wait-Job | Receive-Job | Out-Null
$jobs | Remove-Job

Write-Host "Waiting for debounce (500ms)..." -ForegroundColor Gray
Start-Sleep -Milliseconds 600

# Frontend should auto-call ensureHold after debounce
# Simulate manual hold creation
$holdResponse3 = Invoke-ApiCall -Method POST -Endpoint "/cart/hold" -Body @{
    userId = $UserId
    cartId = $cartId
}
$holdId3 = $holdResponse3.holdId
Write-Host "Hold ID 3: $holdId3" -ForegroundColor Green

# Test 8: Final verification
Write-Host ""
Write-Host "Test 8: Final hold state verification..." -ForegroundColor Yellow
$finalCart = Invoke-ApiCall -Method GET -Endpoint "/cart"
$finalQty = $finalCart.items[0].qty
Write-Host "Final quantity in cart: $finalQty" -ForegroundColor Green
Write-Host "Expected: Only 1 PENDING hold with qty=$finalQty" -ForegroundColor Cyan

# Test 9: Stock calculation check
Write-Host ""
Write-Host "Test 9: Verifying stock calculation..." -ForegroundColor Yellow
try {
    $zoneInfo = Invoke-ApiCall -Method GET -Endpoint "/events/1/zones/1"
    Write-Host "Zone Info: $($zoneInfo | ConvertTo-Json -Compress)" -ForegroundColor Gray
    Write-Host "✓ Verify seats_sold + active_holds doesn't double-count" -ForegroundColor Cyan
} catch {
    Write-Host "Zone endpoint not available or requires different path" -ForegroundColor Gray
}

# Test 10: Concurrent hold creation (advanced)
Write-Host ""
Write-Host "Test 10: Testing concurrent hold creation..." -ForegroundColor Yellow
Write-Host "Sending 3 parallel hold requests..." -ForegroundColor Gray

$concurrentJobs = @()
for ($i = 1; $i -le 3; $i++) {
    $concurrentJobs += Start-Job -ScriptBlock {
        param($url, $userId, $cartId, $token)
        $headers = @{
            "Authorization" = "Bearer $token"
            "X-User-Id" = $userId
            "Content-Type" = "application/json"
        }
        $body = @{ userId = $userId; cartId = $cartId } | ConvertTo-Json
        Invoke-RestMethod -Uri "$url/cart/hold" -Method POST -Headers $headers -Body $body
    } -ArgumentList $BaseURL, $UserId, $cartId, $Token
}

$concurrentResults = $concurrentJobs | Wait-Job | Receive-Job
$concurrentJobs | Remove-Job

Write-Host "Concurrent results:" -ForegroundColor Gray
$concurrentResults | ForEach-Object { 
    Write-Host "  Hold ID: $($_.holdId)" -ForegroundColor Gray
}

# Test 11: Cleanup
Write-Host ""
Write-Host "Test 11: Cleaning up test data..." -ForegroundColor Yellow
try {
    Invoke-ApiCall -Method DELETE -Endpoint "/cart" | Out-Null
    Write-Host "✓ Cart cleared" -ForegroundColor Green
} catch {
    Write-Host "Cart cleanup failed or already empty" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Summary report
Write-Host ""
Write-Host "📊 Test Summary:" -ForegroundColor Yellow
Write-Host "  Hold ID 1 (qty=2): $holdId1 - should be EXPIRED" -ForegroundColor Gray
Write-Host "  Hold ID 2 (qty=4): $holdId2 - should be EXPIRED" -ForegroundColor Gray
Write-Host "  Hold ID 3 (qty=$finalQty): $holdId3 - should be PENDING" -ForegroundColor Gray

Write-Host ""
Write-Host "🔍 Manual Verification Steps:" -ForegroundColor Yellow
Write-Host "1. Open MySQL Workbench or CLI" -ForegroundColor White
Write-Host "2. Run: SELECT * FROM reservation_hold WHERE user_id=$UserId ORDER BY created_at DESC;" -ForegroundColor Cyan
Write-Host "3. Verify only 1 PENDING hold exists per cart_item" -ForegroundColor White
Write-Host "4. Verify old holds are marked EXPIRED, not deleted" -ForegroundColor White
Write-Host "5. Check Spring Boot logs for 'Expirados X holds antiguos' messages" -ForegroundColor White
Write-Host "6. Test frontend countdown timer updates correctly" -ForegroundColor White

Write-Host ""
Write-Host "📝 MySQL Verification Queries:" -ForegroundColor Yellow
@"

-- View all holds for test user (shows cleanup history)
SELECT id, cart_item_id, qty, status, expires_at, created_at
FROM reservation_hold
WHERE user_id = $UserId
ORDER BY cart_item_id, created_at;

-- Count active vs expired holds
SELECT status, COUNT(*) as count, SUM(qty) as total_qty
FROM reservation_hold
WHERE user_id = $UserId
GROUP BY status;

-- Verify no duplicate PENDING holds per cart_item
SELECT cart_item_id, COUNT(*) as pending_count
FROM reservation_hold
WHERE user_id = $UserId AND status = 'PENDING'
GROUP BY cart_item_id
HAVING pending_count > 1;

-- If this query returns rows, THE BUG STILL EXISTS!

-- Check stock calculation for zone 1
SELECT 
    ez.seats_quota,
    ez.seats_sold,
    (SELECT COALESCE(SUM(qty), 0) 
     FROM reservation_hold 
     WHERE event_zone_id = 1 
       AND status = 'PENDING' 
       AND expires_at > NOW()) as active_holds,
    (ez.seats_quota - ez.seats_sold - 
     (SELECT COALESCE(SUM(qty), 0) 
      FROM reservation_hold 
      WHERE event_zone_id = 1 
        AND status = 'PENDING' 
        AND expires_at > NOW())) as available
FROM event_zone ez
WHERE ez.id = 1;

"@ | Write-Host -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ To run this script:" -ForegroundColor Green
Write-Host "1. Update `$Token with a valid JWT from /api/auth/login" -ForegroundColor White
Write-Host "2. Ensure backend is running on localhost:8080" -ForegroundColor White
Write-Host "3. Run: .\test_hold_idempotency.ps1" -ForegroundColor White
