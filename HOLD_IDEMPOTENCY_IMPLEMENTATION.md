# Hold Idempotency Implementation

## Problem Solved

### Original Issue
When users modified cart quantities or refreshed holds, the system created **duplicate hold records** without expiring previous ones:
- User adds 2 tickets → creates hold with qty=2
- User changes to 4 tickets → creates ANOTHER hold with qty=4
- Both holds remained PENDING, over-reserving stock (2+4=6 tickets blocked instead of 4)

### Root Cause
`ReservationServiceImpl.placeHold()` always called `holdRepo.save()` without checking or cleaning previous holds for the same `cart_item_id`.

## Solution Architecture

### Backend Changes

#### 1. Repository Layer (`ReservationHoldRepository.java`)
Added two new query methods for cleanup:

```java
/**
 * Finds all PENDING/WAITING holds for a user's cart items.
 * Used to identify holds that need expiration before creating new ones.
 */
List<ReservationHold> findByUserAndCartItemIds(
    @Param("userId") Integer userId,
    @Param("cartItemIds") List<Long> cartItemIds
);

/**
 * Bulk expires holds by ID list (PENDING/WAITING → EXPIRED).
 * Atomic operation within transaction.
 */
@Modifying
int expireByIds(@Param("ids") List<Integer> ids);
```

#### 2. Service Layer (`ReservationServiceImpl.java`)
Refactored `placeHold()` with cleanup-before-create pattern:

```java
@Transactional
public Integer placeHold(Integer userId, Integer cartId) {
    // 1. Read cart items
    List<CartItemRow> items = jdbc.query(...);
    
    // 2. CLEANUP: Expire old holds for these cart_item_ids
    List<Long> cartItemIds = items.stream()
        .map(CartItemRow::id)
        .collect(Collectors.toList());
    
    List<ReservationHold> oldHolds = holdRepo.findByUserAndCartItemIds(userId, cartItemIds);
    if (!oldHolds.isEmpty()) {
        List<Integer> oldHoldIds = oldHolds.stream()
            .map(ReservationHold::getId)
            .collect(Collectors.toList());
        holdRepo.expireByIds(oldHoldIds);
    }
    
    // 3. Create fresh holds with current qty
    for (CartItemRow it : items) {
        // ... (existing logic for PENDING/WAITING determination)
        holdRepo.save(hold);
    }
}
```

### Frontend Optimizations

#### 3. CartContext.jsx
Added two mechanisms to prevent redundant hold API calls:

**A) Concurrency Prevention**
```jsx
const holdCreationInProgress = React.useRef(false)

const ensureHold = useCallback(async () => {
    if (holdCreationInProgress.current) return  // Exit if already running
    holdCreationInProgress.current = true
    try {
        // ... API call
    } finally {
        holdCreationInProgress.current = false
    }
}, [dependencies])
```

**B) Debouncing**
```jsx
useEffect(() => {
    const timer = setTimeout(() => {
        ensureHold()
    }, 500)  // Wait 500ms after last item change
    return () => clearTimeout(timer)
}, [ensureHold, items])
```

## Edge Cases Handled

| Scenario | Behavior | Test Strategy |
|----------|----------|---------------|
| **Duplicate qty changes** | Backend expires old hold, creates new | Add item, change qty 3x rapidly |
| **Concurrent requests** | `useRef` flag prevents parallel calls | Open 2 tabs, modify cart simultaneously |
| **Expired renewal** | Frontend detects expiry, calls `ensureHold()` | Wait 15+ minutes, click "Renovar reserva" |
| **WAITING → PENDING promotion** | Cleanup preserves promotion logic | Fill stock to capacity, trigger queue |
| **Empty cart** | No hold created if items.length === 0 | Remove all items after hold exists |
| **Network retry** | Backend cleanup handles duplicate POST | Simulate 500 error, auto-retry request |

## Transaction Guarantees

1. **Atomicity**: Entire cleanup + creation wrapped in `@Transactional`
2. **Isolation**: Pessimistic lock on `EventZone` prevents concurrent over-booking
3. **Consistency**: Stock calculation excludes EXPIRED holds via `sumPendingActiveQtyByZone`
4. **Durability**: All state changes persisted before transaction commit

## Stock Calculation Flow

```
Available = SeatsQuota - SeatsSold - SumOfActivePendingHolds
Active = (status = PENDING AND expiresAt > now)
```

**Before fix:**
```
User holds: [id=1, qty=2, PENDING], [id=2, qty=4, PENDING]
SumOfActivePendingHolds = 6  ← WRONG (over-counts)
```

**After fix:**
```
User holds: [id=1, qty=2, EXPIRED], [id=2, qty=4, PENDING]
SumOfActivePendingHolds = 4  ← CORRECT
```

## Testing Checklist

### Backend Unit Tests
- [ ] `placeHold()` expires previous holds before creating new ones
- [ ] `findByUserAndCartItemIds()` returns only PENDING/WAITING holds
- [ ] `expireByIds()` updates status to EXPIRED
- [ ] Empty cart throws exception with proper message
- [ ] WAITING holds assigned correct FIFO position

### Integration Tests
- [ ] Add item → modify qty → verify only 1 PENDING hold exists
- [ ] Two users racing for last ticket → one gets PENDING, one gets WAITING
- [ ] Hold expires → renewal creates new hold with fresh TTL
- [ ] Checkout with expired hold → throws "No existe una reserva activa"
- [ ] Payment approval → holds marked CONFIRMED, stock incremented

### Frontend E2E Tests
- [ ] Add item → countdown starts immediately
- [ ] Modify qty → countdown doesn't reset mid-update (debounce works)
- [ ] Hold expires → "Renovar reserva" button appears
- [ ] Click renewal → new countdown starts from 15:00
- [ ] Navigate to payment step → countdown still visible

## Performance Considerations

1. **Bulk Expiration**: `expireByIds()` uses single UPDATE query, not N individual updates
2. **Debounce Timing**: 500ms balances responsiveness vs API load
3. **Pessimistic Locking**: Only held during stock calculation, released after hold creation
4. **Query Optimization**: Indexes on `user_id`, `cart_item_id`, `status`, `expires_at`

## Rollback Plan

If issues arise, revert to pre-cleanup behavior:
1. Remove calls to `findByUserAndCartItemIds()` and `expireByIds()`
2. Keep new repository methods (no harm if unused)
3. Add application-level deduplication in checkout validation

## Future Enhancements

1. **Hold Grouping**: Assign `group_id` to all holds from same `placeHold()` call
2. **Audit Trail**: Log cleanup events with old/new hold IDs
3. **Admin Dashboard**: View/expire holds manually for customer support
4. **Metrics**: Track avg holds per user, expiration rate, renewal frequency

## Related Files Modified

- `Backend/DigiTicket/src/main/java/com/digiticket/repository/reservation/ReservationHoldRepository.java`
- `Backend/DigiTicket/src/main/java/com/digiticket/service/impl/reservation/ReservationServiceImpl.java`
- `Frontend/src/context/CartContext.jsx`

---

**Implementation Date**: 2025
**Reviewed By**: Development Team
**Status**: ✅ Ready for Testing
