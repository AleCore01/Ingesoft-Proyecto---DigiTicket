# Manejo de Expiración de Holds - Implementación Completa

## 🎯 Objetivo

Mejorar la UX cuando el hold expira durante las 3 fases del checkout, validando disponibilidad de stock al renovar.

---

## ✅ Comportamiento Implementado

### **Fase 1: Carrito (Paso 1)**

#### Cuando el hold está activo:
- ✅ Muestra badge azul con countdown (mm:ss)
- ✅ Botón "CONTINUAR" habilitado (fucsia)

#### Cuando el hold expira (00:00):
- ⚠️ Muestra alerta roja: "La reserva expiró"
- 🔄 Botón principal cambia a "RENOVAR RESERVA" (rojo)
- ⚠️ Mensaje explica que debe renovar para verificar disponibilidad

### **Fase 2: Información de Pago (Paso 2)**

#### Cuando el hold está activo:
- ✅ Badge compacto en la parte superior del formulario
- ✅ Botón "PAGAR" habilitado

#### Cuando el hold expira (00:00):
- ⚠️ Alerta roja arriba del formulario
- 🔄 Botón "Renovar reserva" disponible
- 🔙 Botón "← Volver al carrito" para revisar items
- ❌ Botón "PAGAR" deshabilitado
- 📝 Mensaje bajo el botón pagar: "Stock liberado. Renueva arriba..."

### **Fase 3: Confirmación**
- ✅ No se muestra countdown (pago ya procesado)
- ✅ Pantalla de éxito con número de orden

---

## 🔧 Cambios Técnicos

### 1. CartContext.jsx - Validación de Stock

**Antes:**
```jsx
const ensureHold = useCallback(async () => {
    // ...
    const holdResp = await cartService.placeHoldWith(uId, cartId)
    setHoldId(holdData?.holdId || null)
    setHoldExpiresAt(holdData?.expiresAt || null)
    // No manejaba errores de stock
}, [user, cartId, holdExpiresAt, items])
```

**Después:**
```jsx
const ensureHold = useCallback(async () => {
    try {
        // ... validaciones
        const holdResp = await cartService.placeHoldWith(uId, cartId)
        setHoldId(holdData?.holdId || null)
        setHoldExpiresAt(holdData?.expiresAt || null)
        return { success: true }
    } catch (e) {
        // 🆕 Detectar error de stock agotado (409 Conflict)
        if (e?.response?.status === 409 || errorMsg.includes('sin cupo')) {
            alert('⚠️ Algunos tickets ya no están disponibles.')
            await loadCart() // Recargar para ver qué quedó
            return { success: false, reason: 'stock' }
        }
        return { success: false, reason: 'error' }
    }
}, [user, cartId, holdExpiresAt, items, loadCart])
```

**Casos manejados:**
- ✅ HTTP 409 (Conflict) → Stock agotado
- ✅ Mensaje con "sin cupo", "agotado", "disponible"
- ✅ Recarga automática del carrito después del error
- ✅ Alerta al usuario sobre items no disponibles

### 2. CartClient.jsx - Botones Dinámicos

#### Cambio en Fase 1 (línea ~280):
```jsx
// ANTES: Siempre mostraba "CONTINUAR"
<button onClick={handleContinueToPayment}>CONTINUAR</button>

// DESPUÉS: Cambia según estado del hold
{holdRemainingSeconds === 0 ? (
    <button onClick={ensureHold} className="bg-red-600">
        RENOVAR RESERVA
    </button>
) : (
    <button onClick={handleContinueToPayment} className="bg-fuchsia-600">
        CONTINUAR
    </button>
)}
```

#### Cambio en Fase 2 (línea ~313):
```jsx
// ANTES: Solo botón "Renovar"
<button onClick={ensureHold}>Renovar</button>

// DESPUÉS: Dos opciones
<div className="flex gap-2">
    <button onClick={handleBackToCart} className="bg-gray-600">
        ← Volver al carrito
    </button>
    <button onClick={ensureHold} className="bg-red-600">
        Renovar reserva
    </button>
</div>
```

#### Mejorado badge de alerta Fase 1:
```jsx
// ANTES: Solo mostraba mensaje simple
{holdRemainingSeconds === 0 && <p>La reserva expiró</p>}

// DESPUÉS: Mensaje más informativo
{holdRemainingSeconds === 0 && (
    <div className="bg-red-50 border border-red-300 rounded-xl p-4">
        <p className="font-semibold">⏱️ La reserva expiró</p>
        <p className="text-xs">
            El stock fue liberado. Usa el botón "RENOVAR RESERVA" 
            abajo para verificar disponibilidad.
        </p>
    </div>
)}
```

---

## 🎬 Flujos de Usuario

### Escenario 1: Usuario deja pasar el tiempo en Fase 1
1. Timer llega a 00:00
2. ❌ Stock se libera automáticamente (backend)
3. ⚠️ Alerta roja aparece: "La reserva expiró"
4. 🔄 Botón cambia a "RENOVAR RESERVA"
5. Usuario hace clic en "RENOVAR RESERVA"
6. **Si hay stock:** ✅ Nuevo hold por 15 min, countdown reinicia
7. **Si NO hay stock:** ⚠️ Alert + recarga carrito (puede eliminar items)

### Escenario 2: Usuario está en Fase 2 y expira
1. Timer llega a 00:00 mientras completa formulario
2. ⚠️ Alerta roja aparece arriba del form
3. ❌ Botón "PAGAR" se deshabilita
4. Usuario puede:
   - **Opción A:** Clic en "Renovar reserva" (intenta crear hold nuevo)
   - **Opción B:** Clic en "← Volver al carrito" (regresa a fase 1)
5. Si renueva y hay stock: ✅ Puede continuar pagando
6. Si renueva sin stock: ⚠️ Regresa a fase 1 con items actualizados

### Escenario 3: Modificar cantidad en Fase 1
1. Usuario cambia qty de 2 a 4
2. Debounce espera 500ms
3. `ensureHold()` se llama automáticamente
4. Backend expira hold antiguo (qty=2)
5. Backend crea hold nuevo (qty=4)
6. Countdown reinicia a 15:00
7. **Si no hay stock para 4:** ⚠️ Alert + recarga (puede volver a qty=2 o eliminar)

---

## 🧪 Testing Manual

### Test 1: Expiración en Fase 1
```
1. Agregar tickets al carrito
2. Observar countdown (debe empezar en ~15:00)
3. Esperar 15 minutos O modificar expiresAt en DB a NOW()
4. Verificar:
   ✅ Badge azul desaparece
   ✅ Alerta roja aparece
   ✅ Botón cambia a "RENOVAR RESERVA" (rojo)
   ✅ Click en renovar → countdown reinicia
```

### Test 2: Expiración en Fase 2
```
1. Agregar tickets, hacer clic en "CONTINUAR"
2. Llenar formulario de pago LENTAMENTE
3. Esperar a que expire (o modificar DB)
4. Verificar:
   ✅ Alerta roja aparece arriba
   ✅ Botón "PAGAR" se deshabilita
   ✅ Aparecen botones "Volver" y "Renovar"
   ✅ Click en Renovar → si hay stock, puede pagar
```

### Test 3: Stock Agotado al Renovar
```
1. Agregar últimos 2 tickets disponibles
2. En otra ventana/usuario: comprar esos tickets
3. En ventana original: esperar expiración
4. Click en "RENOVAR RESERVA"
5. Verificar:
   ✅ Alert: "Algunos tickets ya no están disponibles"
   ✅ Carrito se recarga
   ✅ Items sin stock desaparecen (si backend los eliminó)
```

### Test 4: Modificación Rápida de Qty
```
1. Agregar 2 tickets
2. Cambiar a 3, luego 4, luego 5 (rápido, <500ms entre cambios)
3. Verificar:
   ✅ Solo se envía 1 request después de 500ms
   ✅ Hold final tiene qty=5
   ✅ No hay holds duplicados en BD
```

---

## 🗄️ Verificación en Base de Datos

### Ver holds del usuario:
```sql
SELECT id, cart_item_id, qty, status, expires_at, created_at
FROM reservation_hold
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 10;
```

**Esperado después de renovación:**
```
| id  | cart_item_id | qty | status  | expires_at          |
|-----|--------------|-----|---------|---------------------|
| 123 | 456          | 4   | PENDING | 2025-11-25 15:45:00 | ← Nuevo
| 122 | 456          | 2   | EXPIRED | 2025-11-25 15:30:00 | ← Expirado
```

### Verificar NO hay duplicados PENDING:
```sql
SELECT cart_item_id, COUNT(*) as pending_count
FROM reservation_hold
WHERE user_id = 1 AND status = 'PENDING'
GROUP BY cart_item_id
HAVING pending_count > 1;
```

**Debe devolver 0 filas** (si devuelve algo, hay bug)

---

## 📱 UX Mejorado

### Antes:
- ❌ Botón "Continuar" siempre visible (confuso)
- ❌ Usuario no sabía qué hacer al expirar
- ❌ No validaba stock al renovar
- ❌ Error genérico sin mensaje útil

### Después:
- ✅ Botón cambia a "RENOVAR RESERVA" (claro)
- ✅ Mensajes explican qué pasó y qué hacer
- ✅ Valida stock antes de recrear hold
- ✅ Alerta específica si no hay disponibilidad
- ✅ Opción de volver al carrito en Fase 2
- ✅ Recarga automática para ver estado real

---

## 🔍 Posibles Escenarios Edge

| Escenario | Comportamiento |
|-----------|----------------|
| Usuario en Fase 2, otro compra los tickets | Al renovar: Alert + recarga carrito |
| Red lenta al renovar | Flag `holdCreationInProgress` previene clicks múltiples |
| Backend devuelve error 500 | Catch genérico, no recarga carrito |
| Usuario cambia tab y vuelve después de 20 min | Timer sigue corriendo, muestra 00:00 correctamente |
| Carrito vacío y click en renovar | `ensureHold()` sale temprano (if items.length === 0) |

---

## 📄 Archivos Modificados

1. **Frontend/src/context/CartContext.jsx**
   - Línea ~177: Función `ensureHold()` con manejo de errores de stock
   - Agrega `loadCart` como dependencia
   - Retorna objeto `{ success, reason }` para manejar errores

2. **Frontend/src/pages/cart/CartClient.jsx**
   - Línea ~238: Badge solo si `holdRemainingSeconds > 0`
   - Línea ~241: Alerta roja mejorada cuando expira
   - Línea ~283: Botón dinámico RENOVAR/CONTINUAR
   - Línea ~313: Alerta en Fase 2 con 2 botones
   - Línea ~427: Mensaje bajo botón PAGAR

---

## ✅ Checklist de Validación

- [x] Botón cambia a "RENOVAR RESERVA" cuando expira en Fase 1
- [x] Alerta roja clara explica qué pasó
- [x] Validación de stock al renovar con manejo de error 409
- [x] Alerta al usuario si tickets no disponibles
- [x] Recarga automática del carrito tras error de stock
- [x] Botones "Volver" y "Renovar" en Fase 2
- [x] Botón "PAGAR" deshabilitado cuando expira
- [x] No hay errores de compilación
- [x] Debouncing sigue funcionando (500ms)
- [x] Backend limpia holds duplicados (implementado previamente)

---

**Status:** ✅ IMPLEMENTACIÓN COMPLETA
**Listo para testing en desarrollo**
