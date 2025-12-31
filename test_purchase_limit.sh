#!/bin/bash

# Script de pruebas para la funcionalidad de límite de compra (HU025)
# =================================================================

BASE_URL="http://localhost:8080"

echo "=========================================="
echo "PRUEBAS - LÍMITE DE COMPRA DE ENTRADAS"
echo "=========================================="
echo ""

# Prueba 1: Consultar límite de compra para un usuario y evento
echo "1. Consultando límite de compra (Usuario 1, Evento 100)..."
curl -s -X GET "${BASE_URL}/api/events/100/purchase-limit?userId=1" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Prueba 2: Consultar límite para otro usuario
echo "2. Consultando límite de compra (Usuario 2, Evento 100)..."
curl -s -X GET "${BASE_URL}/api/events/100/purchase-limit?userId=2" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Prueba 3: Consultar límite para otro evento
echo "3. Consultando límite de compra (Usuario 1, Evento 200)..."
curl -s -X GET "${BASE_URL}/api/events/200/purchase-limit?userId=1" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "=========================================="
echo "NOTAS:"
echo "- maxTicketsPerUser: 4 (límite configurado)"
echo "- alreadyPurchased: tickets ya comprados (órdenes PAID)"
echo "- remaining: tickets que aún puede comprar"
echo ""
echo "Para probar la validación en carrito, usa:"
echo "POST ${BASE_URL}/api/cart/items"
echo "Con Header: X-User-Id: 1"
echo "Body: {\"eventId\": 100, \"eventZoneId\": 1, \"qty\": 5}"
echo ""
echo "Debería retornar error si ya tiene 4 o más tickets comprados."
echo "=========================================="
