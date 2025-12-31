# API de Notificaciones de Vencimiento de Puntos

## 📌 Información General

**Módulo:** Notificaciones de vencimiento de puntos de lealtad  
**Responsable:** (por definir)  
**Branch:** feature/loyalty-expiry-notifications  
**Base URL:** `http://localhost:8080` (desarrollo)

---

## 🎯 Descripción

Este módulo se encarga de **detectar puntos de lealtad próximos a vencer**, generar una **notificación interna** para el cliente y enviar un **correo automático** avisando del vencimiento.

Se manejan dos momentos de aviso:

- **7 días antes** de la fecha de vencimiento.  
- **1 día antes** de la fecha de vencimiento.

Las notificaciones se pueden generar de dos formas:

1. **Automática**, mediante un job diario (`@Scheduled`) a las 09:00 (America/Lima).  
2. **Manual**, mediante un endpoint de administración (`/api/admin/loyalty/notify-expiring`).

En ambos casos:

- Se crean registros en la tabla `notification`.
- Se envía un correo HTML al cliente usando la plantilla de notificaciones.
- Se marca la notificación como enviada (`sent_at`).

---

## ⚙️ Comportamiento de Negocio

### 1. Selección de puntos a notificar

Para cada ejecución (automática o manual), el sistema hace:

1. Calcula la **fecha objetivo**:
   - `today + 7 días` → aviso de “7 días antes”.
   - `today + 1 día` → aviso de “mañana vence”.

2. Busca en `loyalty_point` todos los registros que cumplan:
   - `status = ACTIVE`
   - `expires_at` dentro del día objetivo (entre `00:00` y `<día siguiente 00:00`).

3. Agrupa los resultados por `client_id`.

4. Para cada `client_id`:
   - Suma los `points` activos que vencen ese día.
   - Obtiene el `Client` y el `User` asociados para sacar:
     - `firstName`
     - `email`.

### 2. Mensajes generados

Según el `daysAhead`, el título del aviso cambia:

- Para `daysAhead = 7`:
  - **Título:** `Tus puntos vencerán en 7 días`
- Para `daysAhead = 1`:
  - **Título:** `Tus puntos vencen mañana`
- Para otros valores (fallback):
  - **Título:** `Tus puntos están por vencer`

El cuerpo base del mensaje es:

```text
Hola {firstName},

Tienes {totalPoints} puntos que vencerán el {targetDate}.
Te recomendamos usarlos antes de esa fecha para no perderlos.

¡Gracias por usar DigiTicket!
````

Este texto se guarda en la tabla `notification` y se convierte a HTML en el correo (con saltos de línea y plantilla visual).

---

## ⏰ Proceso Automático (Scheduler)

### Job diario

Existe un scheduler:

```java
@Scheduled(cron = "0 0 9 * * ?", zone = "America/Lima")
public void runDailyExpiryNotifications() {
    loyaltyExpiryNotificationService.notifyExpiringInDays(7);
    loyaltyExpiryNotificationService.notifyExpiringInDays(1);
}
```

**Comportamiento:**

* Se ejecuta **todos los días a las 09:00 (hora Lima)**.
* Llama al servicio de notificación para:

    * Buscar puntos que vencen en 7 días.
    * Buscar puntos que vencen en 1 día.
* Por cada cliente con puntos a vencer:

    * Crea una notificación en BD.
    * Envía un correo al email registrado.
    * Marca la notificación como enviada (`sent_at`).

Este proceso **no expone un endpoint**; es interno al backend.

---

## 📋 Endpoint Disponible (Admin)

### 1. Ejecutar proceso de notificación de vencimiento

Permite al **administrador** ejecutar manualmente el proceso que genera notificaciones y correos, sin esperar al scheduler diario.

**Endpoint:**

```http
POST /api/admin/loyalty/notify-expiring
```

**Autenticación:**

* Requiere token JWT de **administrador**.
* Header típico:

```http
Authorization: Bearer <token_admin>
```

**Body:**
No requiere body.

---

### 💡 Lógica interna del endpoint

Cuando se invoca:

1. Llama a `notifyExpiringInDays(7)` → genera notificaciones y correos para puntos que vencen en 7 días.
2. Llama a `notifyExpiringInDays(1)` → genera notificaciones y correos para puntos que vencen en 1 día.
3. Suma la cantidad de notificaciones creadas en cada caso.

---

### ✅ Respuesta Exitosa (caso sin puntos por vencer)

```json
{
  "message": "No se encontraron clientes con puntos por vencer en las ventanas configuradas.",
  "createdNotifications7Days": 0,
  "createdNotifications1Day": 0
}
```

* Código HTTP: `200 OK`
* No se crean registros nuevos en `notification`.

---

### ✅ Respuesta Exitosa (caso con notificaciones)

```json
{
  "message": "Proceso de notificación ejecutado correctamente.",
  "createdNotifications7Days": 3,
  "createdNotifications1Day": 1,
  "totalNotifications": 4
}
```

* Código HTTP: `200 OK`
* Se crean registros en la tabla `notification` y se envían los correos correspondientes.

---

### ❌ Respuestas de Error

* `401 UNAUTHORIZED` → si no se envía un token válido.
* `403 FORBIDDEN` → si el usuario autenticado no tiene rol de administrador.
* `500 INTERNAL SERVER ERROR` → si ocurre alguna excepción inesperada (por ejemplo, error de SMTP).

---

## ✉️ Envío de Correos

### Servicio de correo

Se usa `EmailService` con dos métodos:

```java
void sendResetPasswordEmail(String to, String token);
void sendNotificationEmail(String to, String subject, String body);
```

El módulo de vencimiento utiliza:

```java
emailService.sendNotificationEmail(toEmail, title, message);
```

### Plantilla HTML de notificación

* Correo en formato HTML.
* Incluye:

    * Logo embebido: `cid:logo` (`static/email/logo_blanco.png`).
    * Header con gradiente y título (`subject`).
    * Cuerpo con el mensaje convertido a `<br>`.
    * Footer informativo y año dinámico.

El contenido de `message` (texto plano) se guarda en la tabla `notification` y se reutiliza para el correo.

---

## 📊 Modelo de Datos

### Tabla `loyalty_point` (resumen relevante)

| Campo      | Tipo     | Descripción                              |
| ---------- | -------- | ---------------------------------------- |
| id         | Integer  | ID del registro de puntos                |
| client_id  | Integer  | Cliente al que pertenecen los puntos     |
| points     | Integer  | Cantidad de puntos                       |
| expires_at | DATETIME | Fecha y hora de expiración de ese bloque |
| status     | Enum     | `ACTIVE`, `USED`, `EXPIRED`, etc.        |

> Solo se consideran para notificación los registros con **`status = ACTIVE`**.

---

### Entidad `Notification`

Tabla `notification`:

| Campo      | Tipo       | Descripción                                        |
| ---------- | ---------- | -------------------------------------------------- |
| id         | Integer PK | ID de la notificación                              |
| client_id  | Integer FK | Cliente al que va dirigida la notificación         |
| title      | String     | Título corto (ej. “Tus puntos vencerán en 7 días”) |
| message    | TEXT       | Mensaje completo (texto plano)                     |
| sent_at    | DATETIME   | Fecha/hora en que se envió el correo               |
| created_at | DATETIME   | Fecha/hora de creación del registro                |
| updated_at | DATETIME   | Fecha/hora de última actualización                 |

**Comportamiento:**

* Al crear la notificación:

    * `title` y `message` se llenan.
    * `sent_at` se setea cuando el correo se envía correctamente.
* La misma información puede usarse para:

    * Mostrar notificaciones en la UI del cliente.
    * Auditar cuándo se enviaron los avisos.

---

## 🧪 Ejemplo de flujo completo

1. Hoy es `2025-12-01`.

2. Existe un `LoyaltyPoint`:

   ```text
   client_id = 4
   points    = 23
   status    = ACTIVE
   expires_at = 2025-12-08 10:00:00
   ```

3. Se ejecuta el proceso (automático o manual):

    * Para `daysAhead = 7` → `targetDate = 2025-12-08`.
    * El registro entra en el rango.

4. El sistema:

    * Agrupa por `client_id = 4`.
    * Calcula `totalPoints = 23`.
    * Genera:

        * `title = "Tus puntos vencerán en 7 días"`.
        * `message` con texto personalizado.
    * Crea un registro en `notification`.
    * Envía un correo HTML a `client.user.email`.
    * Actualiza `sent_at` con la fecha/hora del envío.

---

## ⚠️ Notas Importantes

1. **No se generan notificaciones para puntos vencidos o usados**
   Solo se consideran registros con `status = ACTIVE`.

2. **Ventanas de notificación configuradas**
   Actualmente se manejan dos:

    * 7 días antes del vencimiento.
    * 1 día antes del vencimiento.

3. **Ejecución manual vs automática**

    * El **scheduler** garantiza el envío diario sin intervención humana.
    * El **endpoint admin** permite revisar/re-ejecutar el proceso durante pruebas o demos.

4. **Uso futuro en frontend**
   La tabla `notification` puede consumirse desde la UI del cliente para mostrar un listado de notificaciones, usando `NotificationController` y `NotificationService`.

---

## 📞 Contacto

**Responsable del módulo:** Anibal Gonzales
**Branch:** `feature/loyalty-expiry-notifications`

Para dudas o problemas, contactar al equipo de backend.