# Script para generar datos de prueba masivos para DigiTicket
# Uso: .\generate_test_data.ps1

Write-Host "Generando datos de prueba para DigiTicket..." -ForegroundColor Cyan

# ==================== LOCALES ====================
$localesCount = 50
$cities = @("Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Huancayo", "Tacna", "Puno")
$districts = @{
    "Lima" = @("Miraflores", "San Isidro", "Barranco", "Surco", "La Molina", "Jesús María", "Magdalena", "San Miguel", "Pueblo Libre", "Lince")
    "Arequipa" = @("Cayma", "Cerro Colorado", "Yanahuara", "Sachaca", "José Luis Bustamante")
    "Cusco" = @("Wanchaq", "Santiago", "San Sebastián", "San Jerónimo", "Cusco Centro")
    "Trujillo" = @("Victor Larco", "La Esperanza", "El Porvenir", "Florencia de Mora")
    "Chiclayo" = @("José Leonardo Ortiz", "La Victoria", "Lambayeque")
    "Piura" = @("Castilla", "Veintiséis de Octubre", "Catacaos")
    "Iquitos" = @("Punchana", "Belén", "San Juan Bautista")
    "Huancayo" = @("El Tambo", "Chilca", "Huancán")
    "Tacna" = @("Alto de la Alianza", "Ciudad Nueva", "Gregorio Albarracín")
    "Puno" = @("Juliaca", "San Román", "Puno Centro")
}

$venueTypes = @("Auditorio", "Centro de Convenciones", "Estadio", "Arena", "Teatro", "Club", "Coliseo", "Centro Cultural", "Parque", "Plaza")
$venueNames = @("Municipal", "Nacional", "Metropolitano", "Imperial", "Real", "Central", "Principal", "Gran", "Nuevo", "Moderno")

$localsCSV = "name,address,city,district,capacity,contactEmail`n"

Write-Host "Generando $localesCount locales..." -ForegroundColor Yellow

for ($i = 1; $i -le $localesCount; $i++) {
    $city = $cities | Get-Random
    $district = $districts[$city] | Get-Random
    $venueType = $venueTypes | Get-Random
    $venueName = $venueNames | Get-Random
    $name = "$venueType $venueName de $city"
    $address = "Av. Principal $([int](Get-Random -Minimum 100 -Maximum 9999))"
    $capacity = [int](Get-Random -Minimum 500 -Maximum 15000)
    $email = "contacto.local$i@digiticket.pe"
    
    $localsCSV += "`"$name`",`"$address`",$city,$district,$capacity,$email`n"
}

$localsCSV | Out-File -FilePath ".\locals_test.csv" -Encoding UTF8 -NoNewline
Write-Host "✓ Generado: locals_test.csv ($localesCount locales)" -ForegroundColor Green

# ==================== EVENTOS ====================
$eventsCount = 100
$eventCategories = @{
    "Concierto" = @(1, "rock", "pop", "reggaeton", "salsa", "cumbia", "electronica", "indie", "jazz")
    "Teatro" = @(2, "comedia", "drama", "musical", "infantil", "experimental")
    "Deporte" = @(3, "futbol", "voley", "basketball", "atletismo", "ciclismo")
    "Festival" = @(4, "gastronomico", "cultural", "musical", "artistico")
    "Conferencia" = @(5, "tecnologia", "negocios", "marketing", "innovacion")
}

$artistNames = @("Los Rockeros", "Banda Tropical", "DJ Fiesta", "Orquesta Sinfónica", "Grupo de Teatro", "Comediantes Unidos", 
                 "Artistas en Vivo", "Estrellas del Momento", "Leyendas Peruanas", "Talentos Emergentes", "Superestrellas")

# Unsplash Image Collections por categoría
$unsplashCollections = @{
    "Concierto" = "1154470"  # Concerts & Music
    "Teatro" = "1594734"     # Theatre & Performance
    "Deporte" = "1646719"    # Sports
    "Festival" = "1413066"   # Festivals
    "Conferencia" = "1409933" # Business & Tech
}

$eventsCSV = "title,description,startsAt,salesStartAt,durationMin,locationId,eventCategoryId,administratorId,status,imageUrl`n"

Write-Host "Generando $eventsCount eventos..." -ForegroundColor Yellow

# Admin ID (ajusta según tu DB)
$adminId = 2

for ($i = 1; $i -le $eventsCount; $i++) {
    # Categoría aleatoria
    $categoryKey = $eventCategories.Keys | Get-Random
    $categoryInfo = $eventCategories[$categoryKey]
    $categoryId = $categoryInfo[0]
    $subgenre = $categoryInfo[1..($categoryInfo.Length-1)] | Get-Random
    
    # Artista/nombre
    $artist = $artistNames | Get-Random
    $title = "$categoryKey de $subgenre - $artist"
    
    $description = "Un increíble evento de $subgenre que no te puedes perder. $artist presenta su mejor espectáculo en vivo con toda la energía y talento que los caracteriza. Entradas limitadas!"
    
    # Fechas (eventos entre hoy y los próximos 6 meses)
    $daysAhead = Get-Random -Minimum 7 -Maximum 180
    $eventDate = (Get-Date).AddDays($daysAhead).ToString("yyyy-MM-dd")
    $eventTime = "{0:D2}:00:00" -f (Get-Random -Minimum 18 -Maximum 23)
    $startsAt = "${eventDate}T${eventTime}"
    
    $salesStartDays = Get-Random -Minimum 1 -Maximum 5
    $salesDate = (Get-Date).AddDays($salesStartDays).ToString("yyyy-MM-dd")
    $salesStartAt = "${salesDate}T09:00:00"
    
    $durationMin = Get-Random -Minimum 60 -Maximum 240
    
    # Location ID (1 a 50)
    $locationId = Get-Random -Minimum 1 -Maximum ($localesCount + 1)
    
    $status = if ($i -le 80) { "PUBLISHED" } else { "DRAFT" }
    
    # Imagen de Unsplash (800x600)
    $collectionId = $unsplashCollections[$categoryKey]
    $imageUrl = "https://source.unsplash.com/collection/${collectionId}/800x600?sig=$i"
    
    $eventsCSV += "`"$title`",`"$description`",$startsAt,$salesStartAt,$durationMin,$locationId,$categoryId,$adminId,$status,$imageUrl`n"
}

$eventsCSV | Out-File -FilePath ".\events_test.csv" -Encoding UTF8 -NoNewline
Write-Host "✓ Generado: events_test.csv ($eventsCount eventos)" -ForegroundColor Green

# ==================== ZONAS DE EVENTOS ====================
$zoneTemplates = @(
    @{Name="VIP"; PriceRange=@(150,300); Capacity=@(50,150)},
    @{Name="Platea"; PriceRange=@(80,150); Capacity=@(200,500)},
    @{Name="Tribuna"; PriceRange=@(50,100); Capacity=@(300,800)},
    @{Name="General"; PriceRange=@(30,70); Capacity=@(500,2000)}
)

$zonesCSV = "eventId,displayName,price,seatsQuota,seatsSold,status`n"

Write-Host "Generando zonas para eventos..." -ForegroundColor Yellow

# Generar entre 2 y 4 zonas por evento
for ($eventId = 1; $eventId -le $eventsCount; $eventId++) {
    $numZones = Get-Random -Minimum 2 -Maximum 5
    $selectedZones = $zoneTemplates | Get-Random -Count $numZones
    
    foreach ($zone in $selectedZones) {
        $displayName = $zone.Name
        $price = Get-Random -Minimum $zone.PriceRange[0] -Maximum $zone.PriceRange[1]
        $seatsQuota = Get-Random -Minimum $zone.Capacity[0] -Maximum $zone.Capacity[1]
        $seatsSold = 0
        $status = "ACTIVE"
        
        $zonesCSV += "$eventId,$displayName,$price,$seatsQuota,$seatsSold,$status`n"
    }
}

$zonesCSV | Out-File -FilePath ".\event_zones_test.csv" -Encoding UTF8 -NoNewline
Write-Host "✓ Generado: event_zones_test.csv (zonas para $eventsCount eventos)" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ Generación completada exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nArchivos generados:" -ForegroundColor White
Write-Host "  • locals_test.csv       - $localesCount locales" -ForegroundColor Gray
Write-Host "  • events_test.csv       - $eventsCount eventos con imágenes de Unsplash" -ForegroundColor Gray
Write-Host "  • event_zones_test.csv  - Zonas para cada evento" -ForegroundColor Gray
Write-Host "`nPasos siguientes:" -ForegroundColor Yellow
Write-Host "  1. Carga locals_test.csv en 'Crear Local' → Carga masiva" -ForegroundColor White
Write-Host "  2. Carga events_test.csv en 'Crear Evento' → Carga masiva" -ForegroundColor White
Write-Host "  3. IMPORTANTE: Ajusta los eventId en event_zones_test.csv" -ForegroundColor Red
Write-Host "     - Opción A: Consulta la DB para ver los IDs reales asignados" -ForegroundColor White
Write-Host "     - Opción B: Usa el script adjust_zone_ids.ps1 (ver abajo)" -ForegroundColor White
Write-Host "  4. Carga event_zones_test.csv en 'Crear Evento' → Carga masiva zonas" -ForegroundColor White
Write-Host "`nNota: Las imágenes se descargan automáticamente de Unsplash" -ForegroundColor Cyan
Write-Host "      Si algunas fallan, el backend usará imagen por defecto" -ForegroundColor Cyan
Write-Host "`n⚠️  IMPORTANTE: Los eventId en event_zones_test.csv son 1-$eventsCount" -ForegroundColor Yellow
Write-Host "   Si tu DB ya tiene eventos, estos IDs NO coincidirán." -ForegroundColor Yellow
Write-Host "   Ejecuta este query SQL para obtener los IDs reales:" -ForegroundColor Cyan
Write-Host "   SELECT id, title FROM event ORDER BY id DESC LIMIT $eventsCount;`n" -ForegroundColor Gray
