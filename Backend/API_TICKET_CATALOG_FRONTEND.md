# API de Catálogo de Entradas

## 📌 Información General

**Módulo:** Catálogo de Entradas (Solo Lectura)  
**Responsable:** Omar  
**Branch:** feature/catalogo-entradas  
**Base URL:** `http://localhost:8080` (desarrollo)

## 🎯 Descripción

Esta API permite consultar los tipos de tickets/entradas disponibles para cada evento con su precio y stock disponible.

**Características:**
- Solo lectura (GET requests)
- No modifica datos
- Retorna tickets ordenados por precio ascendente

---

## 📋 Endpoints Disponibles

### 1. Listar Tickets por Evento

Obtiene todos los tipos de tickets disponibles para un evento específico, ordenados por precio ascendente.

**Endpoint:**
```
GET /api/events/{eventId}/tickets
```

**Parámetros:**
| Parámetro | Tipo | Ubicación | Requerido | Descripción |
|-----------|------|-----------|-----------|-------------|
| eventId | Integer | Path | Sí | ID del evento |

**Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 3,
    "eventId": 1,
    "name": "Estudiante",
    "price": 30.00,
    "stock": 50,
    "availableStock": 50
  },
  {
    "id": 1,
    "eventId": 1,
    "name": "General",
    "price": 50.00,
    "stock": 100,
    "availableStock": 100
  },
  {
    "id": 2,
    "eventId": 1,
    "name": "VIP",
    "price": 150.00,
    "stock": 20,
    "availableStock": 20
  }
]
```

**Respuestas de Error:**
- `404 NOT FOUND`: El evento no existe
```json
{
  "timestamp": "2025-11-05T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Event not found with id: 999",
  "path": "/api/events/999/tickets"
}
```

**Ejemplo de uso (JavaScript):**
```javascript
const response = await fetch(`http://localhost:8080/api/events/${eventId}/tickets`);
const tickets = await response.json();
```

---

### 2. Obtener Ticket Específico

Obtiene información detallada de un tipo de ticket por su ID.

**Endpoint:**
```
GET /api/tickets/{ticketTypeId}
```

**Parámetros:**
| Parámetro | Tipo | Ubicación | Requerido | Descripción |
|-----------|------|-----------|-----------|-------------|
| ticketTypeId | Integer | Path | Sí | ID del tipo de ticket |

**Respuesta Exitosa (200 OK):**
```json
{
  "id": 1,
  "eventId": 1,
  "name": "General",
  "price": 50.00,
  "stock": 100,
  "availableStock": 100
}
```

**Respuestas de Error:**
- `404 NOT FOUND`: El ticket no existe
```json
{
  "timestamp": "2025-11-05T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "TicketType not found with id: 999",
  "path": "/api/tickets/999"
}
```

**Ejemplo de uso (JavaScript):**
```javascript
const response = await fetch(`http://localhost:8080/api/tickets/${ticketId}`);
const ticket = await response.json();
```

---

### 3. Obtener Stock Disponible

Consulta únicamente el stock disponible de un tipo de ticket.

**Endpoint:**
```
GET /api/tickets/{ticketTypeId}/available-stock
```

**Parámetros:**
| Parámetro | Tipo | Ubicación | Requerido | Descripción |
|-----------|------|-----------|-----------|-------------|
| ticketTypeId | Integer | Path | Sí | ID del tipo de ticket |

**Respuesta Exitosa (200 OK):**
```json
{
  "ticketTypeId": 1,
  "availableStock": 100
}
```

**Respuestas de Error:**
- `404 NOT FOUND`: El ticket no existe

**Ejemplo de uso (JavaScript):**
```javascript
const response = await fetch(`http://localhost:8080/api/tickets/${ticketId}/available-stock`);
const { availableStock } = await response.json();
```

---

## 📊 Modelo de Datos

### TicketTypeDTO

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único del tipo de ticket |
| eventId | Integer | ID del evento al que pertenece |
| name | String | Nombre del tipo de ticket (ej: "General", "VIP", "Estudiante") |
| price | Decimal | Precio del ticket |
| stock | Integer | Stock total de tickets (físico) |
| availableStock | Integer | Stock disponible para comprar ahora |

**Nota importante:** Actualmente `stock` y `availableStock` son iguales. Cuando se implemente el módulo de Reservas, `availableStock` restará los tickets en hold temporal.

---

## 🧪 Datos de Prueba Disponibles

Eventos con tickets configurados:

| Event ID | Nombre Evento | Tipos de Tickets Disponibles |
|----------|---------------|------------------------------|
| 1 | Rock Fest | Estudiante, General, VIP |
| 2 | Stand-up Night | General, Platea, VIP Front Row |
| 3 | Pop Live | Balcón, General, Golden Circle |
| 8 | iteracion2 | Entrada General, Premium |
| 10 | Prueba | Test General, Test VIP |

---

##  URLs de Prueba Rápida

Puedes copiar estas URLs directamente en el navegador para verificar:

```
http://localhost:8080/api/events/1/tickets
http://localhost:8080/api/events/2/tickets
http://localhost:8080/api/tickets/1
http://localhost:8080/api/tickets/1/available-stock
```

---

## ⚠️ Notas Importantes

1. **Solo Lectura:** Todos los endpoints son GET. No modifican datos.

2. **Stock vs Available Stock:**
   - `stock`: Total de tickets creados (no cambia)
   - `availableStock`: Tickets disponibles para comprar AHORA
   - Actualmente son iguales, pero cuando se implemente el módulo de Reservas, `availableStock` restará los holds temporales.

3. **Ordenamiento:** Los tickets se retornan ordenados por precio ascendente.

4. **Validaciones:** 
   - Si el evento no existe → `404 NOT FOUND`
   - Si el ticket no existe → `404 NOT FOUND`

5. **Performance:** Todas las consultas están optimizadas con índices en la base de datos.

---

## 📞 Contacto

**Responsable del módulo:** Omar  
**Branch:** `feature/catalogo-entradas`  

Para dudas o problemas, contactar al equipo de backend.
