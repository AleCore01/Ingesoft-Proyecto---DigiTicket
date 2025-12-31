# Guía Rápida: Carga Masiva de Datos de Prueba

## 🚀 Generar CSVs con Datos Ficticios

### Opción 1: Script PowerShell (Recomendado)
```powershell
# Ejecutar desde la raíz del proyecto
.\generate_test_data.ps1
```

Esto genera automáticamente:
- `locals_test.csv` - 50 locales en diferentes ciudades
- `events_test.csv` - 100 eventos con imágenes de Unsplash
- `event_zones_test.csv` - 2-4 zonas por cada evento

### Opción 2: Generar Manualmente

#### 📍 Locales (locals.csv)
```csv
name,address,city,district,capacity,contactEmail
"Auditorio Municipal de Lima","Av. Principal 1234",Lima,Miraflores,5000,contacto1@example.com
"Centro de Convenciones Imperial","Calle Real 567",Arequipa,Cayma,8000,contacto2@example.com
"Estadio Nacional","Av. Deportes 890",Lima,San Isidro,12000,contacto3@example.com
```

**Columnas:**
- `name`: Nombre del local
- `address`: Dirección
- `city`: Ciudad
- `district`: Distrito
- `capacity`: Capacidad numérica
- `contactEmail`: Email (opcional)

---

## 🖼️ Imágenes para Eventos

### Método 1: Unsplash (Automático)
Usa URLs de Unsplash en el CSV - se descargan automáticamente:

```
https://source.unsplash.com/collection/1154470/800x600?sig=1
```

**Colecciones recomendadas por categoría:**
- Conciertos: `1154470`
- Teatro: `1594734`
- Deportes: `1646719`
- Festivales: `1413066`
- Conferencias: `1409933`

**Ejemplo en CSV:**
```csv
title,description,startsAt,salesStartAt,durationMin,locationId,eventCategoryId,administratorId,status,imageUrl
"Concierto de Rock","Evento increíble",2025-12-20T20:00:00,2025-11-27T09:00:00,120,1,1,2,PUBLISHED,https://source.unsplash.com/collection/1154470/800x600?sig=1
```

### Método 2: Base64 (Manual)
Si tienes imágenes locales:

```powershell
# Convertir imagen a Base64
$bytes = [System.IO.File]::ReadAllBytes("C:\ruta\imagen.jpg")
$base64 = [Convert]::ToBase64String($bytes)
Write-Output "data:image/jpeg;base64,$base64"
```

Luego usa la columna `imageBase64` en lugar de `imageUrl`.

### Método 3: URLs directas
Si tienes hosting propio:
```
https://mi-servidor.com/imagenes/evento1.jpg
```

---

## 🎫 Eventos (events.csv)

```csv
title,description,startsAt,salesStartAt,durationMin,locationId,eventCategoryId,administratorId,status,imageUrl
"Concierto de Rock - Los Rockeros","Un evento increíble de rock alternativo",2025-12-20T20:00:00,2025-11-27T09:00:00,120,1,1,2,PUBLISHED,https://source.unsplash.com/collection/1154470/800x600?sig=1
"Festival Gastronómico 2025","Sabores del Perú en un solo lugar",2025-12-25T18:00:00,2025-11-28T10:00:00,180,2,4,2,PUBLISHED,https://source.unsplash.com/collection/1413066/800x600?sig=2
```

**Columnas:**
- `title`: Título del evento
- `description`: Descripción
- `startsAt`: Fecha/hora inicio (formato: `YYYY-MM-DDTHH:MM:SS`)
- `salesStartAt`: Inicio de ventas (formato: `YYYY-MM-DDTHH:MM:SS`)
- `durationMin`: Duración en minutos
- `locationId`: ID del local (debe existir previamente)
- `eventCategoryId`: 1=Concierto, 2=Teatro, 3=Deporte, 4=Festival, 5=Conferencia
- `administratorId`: ID del admin (generalmente 2)
- `status`: DRAFT, PUBLISHED, CANCELED, FINISHED
- `imageUrl`: URL de imagen (Unsplash o propia)
- `imageBase64`: Alternativa a imageUrl (datos Base64)

---

## 🎭 Zonas de Eventos (event_zones.csv)

```csv
eventId,displayName,price,seatsQuota,seatsSold,status
1,VIP,250,100,0,ACTIVE
1,Platea,120,300,0,ACTIVE
1,General,50,1000,0,ACTIVE
2,Tribuna Norte,80,500,0,ACTIVE
2,Tribuna Sur,80,500,0,ACTIVE
```

**Columnas:**
- `eventId`: ID del evento (debe existir)
- `displayName`: Nombre de la zona
- `price`: Precio en soles
- `seatsQuota`: Capacidad total
- `seatsSold`: Vendidos (generalmente 0)
- `status`: ACTIVE, INACTIVE

---

## 📝 Proceso de Carga

### 1️⃣ Cargar Locales
```
Frontend → Crear Local → Carga masiva → Seleccionar locals_test.csv
```

### 2️⃣ Cargar Eventos
```
Frontend → Crear Evento → Carga masiva → Seleccionar events_test.csv
```
⚠️ **Esperar** a que termine la carga (puede tardar con imágenes).

### 3️⃣ Cargar Zonas
```
Frontend → Crear Evento → Carga masiva zonas → Seleccionar event_zones_test.csv
```

---

## 🎨 Tips para Imágenes

### URLs de Unsplash (Recomendado)
✅ **Pros:**
- Automático, no requiere descarga previa
- Imágenes de alta calidad
- Gratis para uso educativo

❌ **Contras:**
- Requiere conexión a internet
- Puede fallar si Unsplash está caído

### Plantilla rápida:
```
https://source.unsplash.com/800x600?music         # Música genérica
https://source.unsplash.com/800x600?concert       # Conciertos
https://source.unsplash.com/800x600?theater       # Teatro
https://source.unsplash.com/800x600?sports        # Deportes
https://source.unsplash.com/800x600?festival      # Festivales
```

Añade `&sig=NUMERO` para forzar diferentes imágenes:
```
https://source.unsplash.com/800x600?music&sig=1
https://source.unsplash.com/800x600?music&sig=2
```

---

## 🔧 Troubleshooting

### "Error al descargar imagen"
- Backend intenta descargar la imagen pero falla
- **Solución:** Verifica la URL o usa Base64

### "Location not found"
- El `locationId` no existe
- **Solución:** Carga primero los locales, luego ajusta los IDs en events.csv

### "EventCategory not found"
- El `eventCategoryId` no existe
- **Solución:** Verifica que las categorías existan en tu DB (1-5)

### CSVs con caracteres especiales
- **Solución:** Guarda con encoding UTF-8 sin BOM

---

## 📊 Datos Realistas para Testing

### Capacidades típicas:
- Teatro pequeño: 200-500
- Teatro grande: 500-1500
- Auditorio: 1000-3000
- Arena/Coliseo: 3000-8000
- Estadio: 8000-50000

### Precios típicos (soles):
- VIP: 150-300
- Platea: 80-150
- Tribuna: 50-100
- General: 30-70

### Fechas:
- Ventas empiezan 1-30 días antes del evento
- Eventos programados 7-180 días en el futuro
- Duración: 60-240 minutos

---

## 🚀 Comando Rápido

```powershell
# Generar todo de una vez
cd C:\Users\Irico\Documents\Pucp\2025-2\IngeSoft\DigiTicket
.\generate_test_data.ps1

# Revisar los archivos generados
Get-Content .\locals_test.csv | Select-Object -First 5
Get-Content .\events_test.csv | Select-Object -First 5
Get-Content .\event_zones_test.csv | Select-Object -First 10
```

¡Listo para cargar! 🎉
