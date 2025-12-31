#!/bin/bash
# Test script for hold idempotency implementation
# Tests various edge cases to ensure holds are created/expired correctly

BASE_URL="http://localhost:8080/api"
USER_ID=1
TOKEN="eyJhbGciOiJIUzI1NiJ9..."  # Replace with valid JWT

echo "========================================="
echo "Hold Idempotency Test Suite"
echo "========================================="

# Helper function to make authenticated requests
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "X-User-Id: $USER_ID" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint"
    else
        curl -s -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "X-User-Id: $USER_ID" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint"
    fi
}

# Test 1: Add item to cart
echo ""
echo "Test 1: Adding item to cart..."
RESPONSE=$(api_call POST "/cart/items" '{
    "eventId": 1,
    "eventZoneId": 1,
    "qty": 2,
    "unitPrice": 50.00
}')
echo "Response: $RESPONSE"

# Get cart ID
CART_ID=$(echo $RESPONSE | grep -oP '"id":\K\d+' | head -1)
echo "Cart ID: $CART_ID"

# Test 2: Create initial hold
echo ""
echo "Test 2: Creating initial hold (qty=2)..."
HOLD_RESPONSE=$(api_call POST "/cart/hold" "{
    \"userId\": $USER_ID,
    \"cartId\": $CART_ID
}")
echo "Hold Response: $HOLD_RESPONSE"
HOLD_ID_1=$(echo $HOLD_RESPONSE | grep -oP '"holdId":\K\d+')
echo "Hold ID 1: $HOLD_ID_1"

# Test 3: Query database for holds (expect 1 PENDING hold)
echo ""
echo "Test 3: Querying holds in database..."
echo "Expected: 1 PENDING hold with qty=2"
# You'll need MySQL access for this
# mysql -u root -p -e "SELECT id, cart_item_id, qty, status FROM reservation_hold WHERE user_id=$USER_ID ORDER BY id DESC LIMIT 5;"

sleep 2

# Test 4: Modify quantity (should expire old hold, create new)
echo ""
echo "Test 4: Modifying quantity to 4..."
ITEM_ID=$(api_call GET "/cart" | grep -oP '"id":\K\d+' | head -1)
UPDATE_RESPONSE=$(api_call PATCH "/cart/items/$ITEM_ID" '{
    "qty": 4
}')
echo "Update Response: $UPDATE_RESPONSE"

sleep 2

# Test 5: Create hold again (should expire qty=2 hold, create qty=4 hold)
echo ""
echo "Test 5: Creating hold after quantity change..."
HOLD_RESPONSE_2=$(api_call POST "/cart/hold" "{
    \"userId\": $USER_ID,
    \"cartId\": $CART_ID
}")
echo "Hold Response 2: $HOLD_RESPONSE_2"
HOLD_ID_2=$(echo $HOLD_RESPONSE_2 | grep -oP '"holdId":\K\d+')
echo "Hold ID 2: $HOLD_ID_2"

# Test 6: Query database again (expect 1 EXPIRED + 1 PENDING)
echo ""
echo "Test 6: Verifying hold cleanup..."
echo "Expected: Hold $HOLD_ID_1 = EXPIRED, Hold $HOLD_ID_2 = PENDING with qty=4"
# mysql -u root -p -e "SELECT id, cart_item_id, qty, status FROM reservation_hold WHERE user_id=$USER_ID ORDER BY id DESC LIMIT 5;"

# Test 7: Rapid qty changes (test debouncing)
echo ""
echo "Test 7: Testing rapid quantity changes (debounce test)..."
for i in {1..5}; do
    api_call PATCH "/cart/items/$ITEM_ID" "{\"qty\": $i}" > /dev/null &
done
wait
sleep 1  # Wait for debounce (500ms)

HOLD_RESPONSE_3=$(api_call POST "/cart/hold" "{
    \"userId\": $USER_ID,
    \"cartId\": $CART_ID
}")
echo "Hold Response 3: $HOLD_RESPONSE_3"

# Test 8: Verify only latest hold is active
echo ""
echo "Test 8: Final hold state verification..."
echo "Expected: Only 1 PENDING hold with qty=5 (last update)"
# mysql -u root -p -e "SELECT id, cart_item_id, qty, status, expires_at FROM reservation_hold WHERE user_id=$USER_ID AND status='PENDING';"

# Test 9: Check stock calculation
echo ""
echo "Test 9: Verifying stock calculation..."
STOCK_INFO=$(api_call GET "/events/1/zones/1")
echo "Stock Info: $STOCK_INFO"
echo "Verify: seats_sold + active_holds should not double-count"

# Test 10: Cleanup - clear cart
echo ""
echo "Test 10: Cleaning up test data..."
api_call DELETE "/cart" > /dev/null
echo "Cart cleared"

echo ""
echo "========================================="
echo "Test Suite Complete"
echo "========================================="
echo ""
echo "Manual Verification Steps:"
echo "1. Check MySQL: SELECT * FROM reservation_hold WHERE user_id=$USER_ID ORDER BY created_at DESC;"
echo "2. Verify only 1 PENDING hold exists per cart_item"
echo "3. Verify old holds are marked EXPIRED, not deleted"
echo "4. Check application logs for 'Expirados X holds antiguos' messages"
echo "5. Monitor frontend countdown timer during tests"

# Database verification queries (run manually)
cat <<EOF

MySQL Verification Queries:
---------------------------

-- View all holds for test user (shows cleanup history)
SELECT id, cart_item_id, qty, status, expires_at, created_at
FROM reservation_hold
WHERE user_id = $USER_ID
ORDER BY cart_item_id, created_at;

-- Count active vs expired holds
SELECT status, COUNT(*) as count, SUM(qty) as total_qty
FROM reservation_hold
WHERE user_id = $USER_ID
GROUP BY status;

-- Verify no duplicate PENDING holds per cart_item
SELECT cart_item_id, COUNT(*) as pending_count
FROM reservation_hold
WHERE user_id = $USER_ID AND status = 'PENDING'
GROUP BY cart_item_id
HAVING pending_count > 1;

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

EOF
