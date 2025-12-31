# API de Gestión de Clientes

## 📌 Información General

**Módulo:** Gestión de Clientes (Perfil y Panel Admin)  
**Responsable:** [Tu nombre]  
**Branch:** `feature/client-crud`  
**Base URL:** `http://localhost:8080` (desarrollo)

---

## 🎯 Descripción

Este módulo expone endpoints para:

- Que el **frontend de cliente** pueda ver y actualizar su perfil.
- Que el **admin** pueda listar clientes activos y desactivarlos (soft delete).
- Mostrar información de **puntos de lealtad** calculados desde el módulo de Loyalty.

**Características principales:**

- Perfil de usuario con:
  - Datos personales
  - Estadísticas de compras (total de compras y monto total gastado)
  - Puntos de lealtad vigentes
- Panel admin:
  - Listado de clientes activos
  - Puntos totales por cliente
  - Fecha de expiración más próxima de puntos
  - Soft delete (cambia el estado del usuario a `INACTIVE`)

---

## 📋 Endpoints Disponibles

### 1. Actualizar Perfil de Usuario

Permite actualizar datos del perfil de un usuario por su `userId`.
Se utiliza principalmente desde el frontend del cliente.

**Endpoint:**

```http
PUT /api/users/{userId}/profile
```

**Parámetros:**

| Parámetro | Tipo    | Ubicación | Requerido | Descripción              |
| --------: | ------- | --------- | --------- | ------------------------ |
|    userId | Integer | Path      | Sí        | ID del usuario (User.id) |

**Body (JSON – `UpdateUserProfileRequest`):**

```json
{
  "firstName": "María",
  "lastName": "Gonzales",
  "phone": "+51 999 111 222",
  "documentType": "DNI",
  "documentNumber": "87654321",
  "birthDate": "1999-05-10"
}
```

> Todos los campos son opcionales a nivel backend, pero el frontend puede validarlos como requeridos según la UX.

**Respuesta Exitosa (200 OK):**

Devuelve el perfil actualizado en formato `UserProfileDTO` (mismo shape que el GET):

```json
{
  "id": 5,
  "firstName": "María",
  "lastName": "Gonzales",
  "email": "maria@example.com",
  "phone": "+51 999 111 222",
  "documentType": "DNI",
  "documentNumber": "87654321",
  "birthDate": "1999-05-10",
  "gender": null,
  "loyaltyPoints": 120,
  "totalPurchases": 3,
  "totalSpent": 250.5,
  "memberSince": "2025-10-01T14:23:11"
}
```

**Respuestas de Error:**

* `404 NOT FOUND`: El usuario o el cliente asociado no existen.
* `400 BAD REQUEST`: Body inválido (formato de fecha, tipo de documento no reconocido, etc.).
* `500 INTERNAL SERVER ERROR`: Error inesperado al actualizar.

---

### 2. Listar Clientes Activos (Admin)

Devuelve la lista de clientes **activos** para el panel de administración, incluyendo sus puntos totales de lealtad y fecha de expiración más próxima.

**Endpoint:**

```http
GET /api/admin/clients
```

**Parámetros de consulta (query params):**

| Parámetro | Tipo   | Requerido | Descripción                                                                 |
| --------- | ------ | --------- | --------------------------------------------------------------------------- |
| name      | String | No        | Texto a buscar en nombre o apellido del cliente (búsqueda case-insensitive) |

* Si **no** se envía `name` → retorna **todos** los clientes activos.
* Si se envía `name` → filtra solo los clientes activos cuyo `firstName` o `lastName` contiene ese texto.

**Ejemplos de uso:**

```http
GET /api/admin/clients
GET /api/admin/clients?name=ana
GET /api/admin/clients?name=rojas
```

Y mantienes igual el JSON de respuesta que ya pusimos.

---

### 🔍 Búsqueda por nombre / apellido (Admin)

El endpoint `GET /api/admin/clients` permite realizar búsquedas simples sobre el nombre y apellido del cliente usando el parámetro `name`:

- La búsqueda es **case-insensitive** (`ana`, `ANA`, `Ana` dan el mismo resultado).
- Se hace un `LIKE %name%` tanto sobre `firstName` como sobre `lastName`.
- Solo se consideran clientes cuyo `User.status = ACTIVE`.

**Ejemplos:**

- `GET /api/admin/clients?name=ana` → puede devolver “Ana Torres”, “Mariana Pérez”, “Juliana Rojas”.
- `GET /api/admin/clients?name=rojas` → devuelve clientes con apellido “Rojas”.

Si `name` viene vacío o no se envía, el backend retorna la misma lista que antes: todos los clientes activos.

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 10,
    "firstName": "María",
    "lastName": "Gonzales",
    "email": "maria@example.com",
    "loyaltyPoints": 120,
    "pointsExpiryDate": "2026-01-15"
  },
  {
    "id": 11,
    "firstName": "José",
    "lastName": "Rojas",
    "email": "jrojas@example.com",
    "loyaltyPoints": 40,
    "pointsExpiryDate": null
  }
]
```

**Notas:**

* `id` es el `Client.id`.
* `loyaltyPoints` viene de `LoyaltyService.getBalance(clientId).totalPoints`.
* `pointsExpiryDate` es la fecha de expiración más cercana entre los puntos activos que vencen en los próximos 30 días.

  * Si no hay puntos por vencer pronto, puede venir `null`.
* Solo se incluyen clientes cuyo `User.status` es `ACTIVE`.

**Respuestas de Error:**

* `200 OK` con lista vacía si no hay clientes activos.
* `500 INTERNAL SERVER ERROR` ante cualquier error inesperado.

---

### 4. Desactivar Cliente (Soft Delete – Admin)

Realiza un **soft delete** de un cliente cambiando el estado del `User` asociado a `INACTIVE`.
No se eliminan filas de la base de datos.

**Endpoint:**

```http
DELETE /api/admin/clients/{clientId}
```

**Parámetros:**

| Parámetro | Tipo    | Ubicación | Requerido | Descripción                  |
| --------: | ------- | --------- | --------- | ---------------------------- |
|  clientId | Integer | Path      | Sí        | ID del cliente (`Client.id`) |

**Respuesta Exitosa (204 NO CONTENT):**

Sin body.

**Respuestas de Error:**

* `404 NOT FOUND`: El cliente no existe.
* `500 INTERNAL SERVER ERROR`: Error inesperado al desactivar el cliente.

---

## 📊 Modelos de Datos

### 1. `UserProfileDTO` (Respuesta de perfil)

| Campo          | Tipo          | Descripción                                 |
| -------------- | ------------- | ------------------------------------------- |
| id             | Integer       | ID del usuario (`User.id`)                  |
| firstName      | String        | Nombre                                      |
| lastName       | String        | Apellidos                                   |
| email          | String        | Correo electrónico                          |
| phone          | String        | Teléfono (desde `Client.phoneNumber`)       |
| documentType   | String        | Tipo de documento (`DNI`, `CE`, etc.)       |
| documentNumber | String        | Número de documento                         |
| birthDate      | LocalDate     | Fecha de nacimiento                         |
| gender         | String/null   | Género (no implementado aún en el modelo)   |
| loyaltyPoints  | Integer       | Puntos totales de lealtad vigentes          |
| totalPurchases | Integer       | Cantidad de compras realizadas              |
| totalSpent     | Double        | Monto total gastado en todas las compras    |
| memberSince    | LocalDateTime | Fecha de creación del usuario (`createdAt`) |

---

### 2. `UpdateUserProfileRequest` (Body de update)

> Nombres exactos pueden variar según tu implementación; la idea general es esta:

| Campo          | Tipo      | Requerido | Descripción                           |
| -------------- | --------- | --------- | ------------------------------------- |
| firstName      | String    | No        | Nuevo nombre                          |
| lastName       | String    | No        | Nuevos apellidos                      |
| phone          | String    | No        | Nuevo teléfono                        |
| documentType   | String    | No        | Nuevo tipo de documento (`DNI`, etc.) |
| documentNumber | String    | No        | Nuevo número de documento             |
| birthDate      | LocalDate | No        | Nueva fecha de nacimiento             |

> El backend solo actualiza los campos que vienen no nulos en el request.

---

### 3. `AdminClientDTO` (Respuesta lista admin)

| Campo            | Tipo      | Descripción                                             |
| ---------------- | --------- | ------------------------------------------------------- |
| id               | Integer   | ID del cliente (`Client.id`)                            |
| firstName        | String    | Nombre del cliente                                      |
| lastName         | String    | Apellidos del cliente                                   |
| email            | String    | Correo electrónico (desde `User.email`)                 |
| loyaltyPoints    | Integer   | Puntos totales de lealtad (cálculo en `LoyaltyService`) |
| pointsExpiryDate | LocalDate | Fecha de expiración más próxima de puntos (o `null`)    |

---

## 🧪 Ejemplos de Uso (JavaScript)

### Obtener perfil de un usuario

```javascript
const userId = 5;
const response = await fetch(`http://localhost:8080/api/users/${userId}/profile`);
const profile = await response.json();
console.log(profile.firstName, profile.loyaltyPoints);
```

### Actualizar perfil de un usuario

```javascript
const userId = 5;
const body = {
  firstName: "María",
  lastName: "Gonzales",
  phone: "+51 999 111 222"
};

const response = await fetch(`http://localhost:8080/api/users/${userId}/profile`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

const updatedProfile = await response.json();
```

### Listar clientes activos (admin)

```javascript
const response = await fetch("http://localhost:8080/api/admin/clients");
const clients = await response.json();
console.table(clients);
```

### Desactivar un cliente (admin)

```javascript
const clientId = 10;
await fetch(`http://localhost:8080/api/admin/clients/${clientId}`, {
  method: "DELETE"
});
```

---

## ⚠️ Notas Importantes

1. **Soft Delete:**

   * El endpoint de admin no borra registros.
   * Solo cambia `User.status` a `INACTIVE`, por lo que el cliente deja de aparecer en el listado de activos.

2. **Puntos de Lealtad:**

   * Se calculan a partir de `LoyaltyPoint` y `LoyaltyService`.
   * El cálculo considera puntos activos y no vencidos, y descuenta usados/expirados.
   * `pointsExpiryDate` se basa en los puntos activos que vencen en los próximos 30 días.

3. **Seguridad (esperada):**

   * `/api/users/{userId}/profile` debería estar protegido para que solo:

     * El propio usuario, o
     * Un admin
       puedan acceder/actualizar.
   * `/api/admin/clients/**` debe estar restringido a `ROLE_ADMIN`.

4. **Performance:**

   * Actualmente `listActiveClients()` usa `findAll()` y filtra en memoria.
     A futuro se puede optimizar usando una query por estado (`findByUser_Status(ACTIVE)`).

---

## 📞 Contacto

**Responsable del módulo:** Anibal Gonzales
**Branch:** `feature/client-crud`

Para dudas o problemas, contactar al equipo de backend.