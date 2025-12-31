# Límite de Compra - Documentación Backend

## Implementación HU025

**Regla de negocio:** Un cliente no puede comprar más de 4 entradas por evento.

---

## Componentes Implementados

### 1. **DTO**
- `PurchaseLimitInfoDTO`: Información del límite (userId, eventId, maxTicketsPerUser, alreadyPurchased, remaining)

### 2. **Excepción**
- `TicketLimitExceededException`: Lanzada cuando se excede el límite
  - `errorCode`: "TICKET_LIMIT_EXCEEDED"
  - `details`: Map con eventId, maxTicketsPerUser, alreadyPurchased, requested

### 3. **Servicio**
- `PurchaseLimitService` / `PurchaseLimitServiceImpl`
  - `getLimitInfo(userId, eventId)`: Consulta el límite
  - `validateLimitOrThrow(userId, eventId, requestedQty)`: Valida y lanza excepción si excede

### 4. **Repository**
- `OrderItemRepository.sumTicketsByUserAndEventAndStatus()`: Suma tickets de órdenes PAID

### 5. **Controller**
- `PurchaseLimitController`: GET `/api/events/{eventId}/purchase-limit?userId={userId}`

### 6. **Integraciones**
- `CartItemServiceImpl`: Valida en `addItem()` y `updateItem()`
- `OrderServiceImpl`: Valida en `checkout()` agrupando por evento
- `GlobalExceptionHandler`: Maneja `TicketLimitExceededException` → HTTP 400

---

## Lógica de Validación

```java
Integer alreadyPurchased = orderItemRepo.sumTicketsByUserAndEventAndStatus(
    userId, eventId, OrderStatus.PAID
);

Integer inCart = cartItemRepo.findByCart_IdAndEventId(cartId, eventId)
    .stream()
    .mapToInt(CartItem::getQty)
    .sum();

Integer total = alreadyPurchased + inCart + requestedQty;

if (total > MAX_TICKETS_PER_USER) {
    throw new TicketLimitExceededException(eventId, 4, alreadyPurchased, requestedQty);
}
```

---

## Testing

**Pruebas unitarias:** `PurchaseLimitServiceImplTest` (9 tests)
- Usuario sin compras → 4 disponibles
- Usuario con 3 comprados → 1 disponible
- Usuario en límite → 0 disponibles
- Validación exitosa y con excepción
- Límites independientes por evento/usuario

**Pruebas de integración:** `PurchaseLimitControllerTest` (4 tests)
- Endpoint retorna JSON correcto
- Diferentes escenarios de límite

**Demostración:** `ExceedLimitDemo` (3 tests)
- Muestra respuestas HTTP cuando se excede y cuando se permite

---

## Configuración

- **Límite:** Hardcodeado en `PurchaseLimitServiceImpl.MAX_TICKETS_PER_USER = 4`
- **Estados considerados:** Solo `OrderStatus.PAID`
- **Scope:** Por usuario + por evento (independientes)

---

## Archivos Modificados

**Nuevos:**
- `dto/purchase/PurchaseLimitInfoDTO.java`
- `exception/TicketLimitExceededException.java`
- `service/purchase/PurchaseLimitService.java`
- `service/impl/purchase/PurchaseLimitServiceImpl.java`
- `controller/purchase/PurchaseLimitController.java`

**Modificados:**
- `repository/order/OrderItemRepository.java` (nuevo query)
- `service/impl/cart/CartItemServiceImpl.java` (validación en add/update)
- `service/impl/order/OrderServiceImpl.java` (validación en checkout)
- `exception/GlobalExceptionHandler.java` (handler para excepción)
