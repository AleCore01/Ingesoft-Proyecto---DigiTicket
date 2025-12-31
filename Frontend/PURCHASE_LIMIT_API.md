# API de Límite de Compra - Documentación Frontend

## Endpoint de Consulta

### GET `/api/events/{eventId}/purchase-limit`

Consulta cuántos tickets puede comprar un usuario para un evento.

**Parámetros:**
- `eventId` (path): ID del evento
- `userId` (query): ID del usuario

**Respuesta exitosa (200):**
```json
{
  "userId": 1,
  "eventId": 100,
  "maxTicketsPerUser": 4,
  "alreadyPurchased": 2,
  "remaining": 2
}
```

**Campos:**
- `maxTicketsPerUser`: Límite máximo (siempre 4)
- `alreadyPurchased`: Tickets ya comprados (solo órdenes PAID)
- `remaining`: Tickets disponibles para comprar

---

## Validación Automática

El backend valida automáticamente el límite en:

### 1. **Agregar al Carrito** (POST `/api/cart/items`)
### 2. **Actualizar Carrito** (PUT `/api/cart/items/{id}`)
### 3. **Checkout** (POST `/api/orders/checkout`)

---

## Error cuando se Excede el Límite

**HTTP Status:** `400 Bad Request`

```json
{
  "errorCode": "TICKET_LIMIT_EXCEEDED",
  "message": "Solo puedes comprar 4 entradas como máximo para este evento.",
  "details": {
    "eventId": 100,
    "maxTicketsPerUser": 4,
    "alreadyPurchased": 3,
    "requested": 2
  }
}
```

**¿Cuándo ocurre?**
- Usuario con 4 tickets intenta comprar más
- Usuario con 3 tickets intenta comprar 2 o más
- Total de tickets (comprados + carrito + solicitados) > 4

---

## Ejemplos de Uso en Frontend

### Mostrar tickets disponibles
```javascript
const response = await fetch(`/api/events/${eventId}/purchase-limit?userId=${userId}`);
const data = await response.json();

if (data.remaining === 0) {
  showMessage("Has alcanzado el límite de 4 tickets para este evento");
  disableBuyButton();
} else {
  showMessage(`Puedes comprar hasta ${data.remaining} tickets más`);
}
```

### Manejar error al agregar al carrito
```javascript
try {
  await addToCart(userId, eventId, eventZoneId, quantity);
} catch (error) {
  if (error.status === 400 && error.errorCode === "TICKET_LIMIT_EXCEEDED") {
    const { alreadyPurchased, maxTicketsPerUser } = error.details;
    showError(`Ya tienes ${alreadyPurchased} tickets. Límite: ${maxTicketsPerUser}`);
  }
}
```

---

## Notas Importantes

✅ El límite es **por usuario por evento** (independiente entre eventos)  
✅ Solo cuenta tickets de órdenes con estado **PAID**  
✅ El carrito actual también cuenta para el límite  
✅ La validación ocurre automáticamente, no necesitas validar en frontend
