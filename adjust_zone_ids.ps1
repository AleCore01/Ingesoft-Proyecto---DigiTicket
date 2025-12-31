# Script para ajustar IDs de event_zones_test.csv después de cargar eventos
# Uso: .\adjust_zone_ids.ps1 -StartEventId 45

param(
    [Parameter(Mandatory=$true)]
    [int]$StartEventId,
    
    [Parameter(Mandatory=$false)]
    [string]$InputFile = ".\event_zones_test.csv",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = ".\event_zones_adjusted.csv"
)

Write-Host "Ajustando IDs de zonas..." -ForegroundColor Cyan
Write-Host "Archivo de entrada: $InputFile" -ForegroundColor Gray
Write-Host "ID inicial de evento: $StartEventId" -ForegroundColor Gray

if (-not (Test-Path $InputFile)) {
    Write-Host "❌ Error: No se encontró $InputFile" -ForegroundColor Red
    Write-Host "   Ejecuta primero generate_test_data.ps1" -ForegroundColor Yellow
    exit 1
}

# Leer CSV
$zones = Import-Csv $InputFile

# Ajustar IDs
$adjustedZones = $zones | ForEach-Object {
    $oldEventId = [int]$_.eventId
    $newEventId = $StartEventId + $oldEventId - 1
    
    [PSCustomObject]@{
        eventId = $newEventId
        displayName = $_.displayName
        price = $_.price
        seatsQuota = $_.seatsQuota
        seatsSold = $_.seatsSold
        status = $_.status
    }
}

# Exportar
$adjustedZones | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding UTF8

Write-Host "✓ Archivo ajustado generado: $OutputFile" -ForegroundColor Green
Write-Host "`nPrimeras 5 filas:" -ForegroundColor Yellow
Get-Content $OutputFile | Select-Object -First 6

Write-Host "`n✓ Listo para cargar en el sistema!" -ForegroundColor Green
Write-Host "  Usa: Crear Evento → Carga masiva zonas → $OutputFile`n" -ForegroundColor White
