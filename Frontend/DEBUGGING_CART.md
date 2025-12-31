# 🐛 Guía de Debugging - Carrito de Compras

## Problema: Items no se agregan correctamente

### ✅ Cambios Realizados

1. **Mapeo de datos del backend** en `CartContext.jsx`
   - Ahora mapea correctamente: `ticketTypeId` → `zoneId`, `qty` → `quantity`
   - Agrega logs para debugging

2. **Estados de carga** mejorados
   - Cada operación (add, update, remove) ahora usa `setLoading`

3. **Logs de debugging** agregados
   - Ver en consola el flujo completo

---

## 🔍 Cómo Debuggear

### 1. Abre la Consola del Navegador (F12)

### 2. Intenta Agregar un Item

Deberías ver estos logs:

```
📤 Agregando al carrito: {
  eventId: 5,
  zoneId: 3,
  quantity: 2,
  eventTitle: "Concierto X",
  ...
}

🔄 Mapeo de datos:
  Frontend: { eventId: 5, zoneId: 3, quantity: 2, ... }
  Backend:  { eventId: 5, ticketTypeId: 3, qty: 2 }

✅ Respuesta del servidor: { id: 1, ... }
```

### 3. Verifica Network Tab

- Filtro: `cart`
- Busca: `POST /api/cart/items`
- Revisa:
  - **Request Payload:** Debe ser `{eventId, ticketTypeId, qty}`
  - **Response:** Debe retornar el item creado
  - **Status:** Debe ser 200 o 201

---

## ⚠️ Problemas Comunes

### Problema 1: "No se envía el request"
**Causa:** Error en autenticación
**Solución:** Verifica que el token esté en localStorage
```javascript
localStorage.getItem('token') // Debe existir
```

### Problema 2: "Backend retorna 400/500"
**Causa:** Formato de datos incorrecto
**Solución:** Verifica que el backend reciba:
```json
{
  "eventId": 5,
  "ticketTypeId": 3,
  "qty": 2
}
```

### Problema 3: "Items no aparecen después de agregar"
**Causa:** Mapeo incorrecto en `loadCart`
**Solución:** Verifica la estructura de respuesta del backend

Agrega este log temporal en `CartContext.jsx`:
```javascript
const loadCart = useCallback(async () => {
  const response = await cartService.getCart()
  console.log('🛒 Respuesta GET /api/cart:', response)
  // ...
}, [])
```

### Problema 4: "Campos vacíos en el carrito"
**Causa:** Backend no retorna todos los campos
**Ejemplo:** Si backend NO retorna `eventTitle`, `eventImage`, etc.

**Solución:** Enriquecer los datos

Agrega esto en `CartContext.jsx` después de mapear:
```javascript
import { eventsService } from '../services/eventsService'

const loadCart = useCallback(async () => {
  const backendItems = data?.items ?? []
  
  // Mapear campos básicos
  const mappedItems = backendItems.map(item => ({
    id: item.id,
    eventId: item.eventId,
    zoneId: item.ticketTypeId,
    zoneName: item.ticketTypeName || '',
    quantity: item.qty,
    price: item.price || 0,
    // Campos que pueden faltar:
    eventTitle: item.eventTitle || '',
    eventImage: item.eventImage || '',
  }))
  
  // Enriquecer con datos del evento si faltan
  const enrichedItems = await Promise.all(
    mappedItems.map(async (item) => {
      if (!item.eventTitle || !item.eventImage) {
        try {
          const event = await eventsService.getById(item.eventId)
          return {
            ...item,
            eventTitle: item.eventTitle || event.title,
            eventImage: item.eventImage || event.imageBase64,
            eventDate: event.startsAt,
          }
        } catch (error) {
          console.warn('No se pudo cargar evento:', item.eventId)
          return item
        }
      }
      return item
    })
  )
  
  setItems(enrichedItems)
}, [])
```

---

## 📋 Checklist de Verificación

Cuando agregues un item, verifica:

- [ ] Request se envía a `POST /api/cart/items`
- [ ] Payload es `{eventId, ticketTypeId, qty}`
- [ ] Response es exitosa (200/201)
- [ ] Response retorna el item creado con `id`
- [ ] `loadCart()` se ejecuta después del `addItem`
- [ ] Request a `GET /api/cart` se ejecuta
- [ ] Response de GET incluye el nuevo item
- [ ] Item se muestra en la UI

---

## 🧪 Test Manual

### En la consola del navegador:

```javascript
// 1. Importa el servicio
import { cartService } from './services/cartService'

// 2. Prueba agregar
const result = await cartService.addItem({
  eventId: 1,
  zoneId: 1,
  quantity: 2
})
console.log('Resultado:', result)

// 3. Verifica el carrito
const cart = await cartService.getCart()
console.log('Carrito:', cart)
```

---

## 🔧 Configuración Temporal

Si el backend aún está en desarrollo, puedes temporalmente usar localStorage:

En `CartContext.jsx` línea 8:
```javascript
const USE_BACKEND = false // Temporal para testing
```

Esto te permitirá probar la UI mientras se arregla el backend.

---

## 📞 Contacto

Si los problemas persisten:
1. Copia los logs de la consola
2. Copia el request/response de Network Tab
3. Comparte la estructura de respuesta del backend
4. Indica qué campos están llegando vacíos

---

**Última actualización:** 5 de noviembre de 2025
