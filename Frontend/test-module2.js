// Script de prueba para validar Módulo 2: Regla de Máx. 4 Tickets por Evento
// Ejecutar en la consola del navegador cuando estés en la página del carrito

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🧪 PRUEBAS - MÓDULO 2: MÁXIMO 4 TICKETS POR EVENTO         ║
╚══════════════════════════════════════════════════════════════╝
`)

// Función helper para simular agregar items
async function testAddItem(eventId, eventTitle, zoneId, zoneName, quantity) {
  console.log(`\n📝 Test: Agregar ${quantity} tickets de "${zoneName}" - ${eventTitle}`)
  
  const item = {
    eventId,
    eventTitle,
    zoneId,
    zoneName,
    price: 100,
    quantity,
    eventDate: new Date().toISOString(),
    eventLocation: 'Test Location',
    eventImage: ''
  }
  
  try {
    // Acceder al contexto del carrito (asumiendo que useCart está disponible)
    const result = await window.cartContextTest.addItem(item)
    
    if (result.ok) {
      console.log(`✅ ÉXITO: Item agregado`)
      return true
    } else {
      console.log(`❌ RECHAZADO: ${result.error}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`)
    return false
  }
}

// Función para mostrar estado del carrito
function showCartStatus() {
  const items = window.cartContextTest?.items || []
  
  console.log(`\n📊 ESTADO DEL CARRITO:`)
  console.log(`Total de items: ${items.length}`)
  
  const groupedByEvent = items.reduce((acc, item) => {
    if (!acc[item.eventId]) {
      acc[item.eventId] = {
        title: item.eventTitle,
        tickets: 0,
        zones: []
      }
    }
    acc[item.eventId].tickets += item.quantity
    acc[item.eventId].zones.push(`${item.zoneName} (${item.quantity})`)
    return acc
  }, {})
  
  Object.entries(groupedByEvent).forEach(([eventId, data]) => {
    console.log(`\n  🎫 Evento ${eventId}: ${data.title}`)
    console.log(`     Total tickets: ${data.tickets}/4`)
    console.log(`     Zonas: ${data.zones.join(', ')}`)
    
    if (data.tickets > 4) {
      console.log(`     ⚠️ ADVERTENCIA: Excede el límite de 4`)
    } else if (data.tickets === 4) {
      console.log(`     ✅ Límite alcanzado`)
    } else {
      console.log(`     ℹ️ Puede agregar ${4 - data.tickets} más`)
    }
  })
}

// SUITE DE PRUEBAS
async function runTests() {
  console.log(`\n🚀 Iniciando suite de pruebas...\n`)
  
  // Test 1: Agregar 3 tickets de un evento (debe funcionar)
  console.log(`\n─────────────────────────────────────────────────────`)
  console.log(`TEST 1: Agregar 3 tickets del mismo evento`)
  await testAddItem(100, 'Concierto Rock', 1, 'VIP', 3)
  showCartStatus()
  
  // Test 2: Agregar 1 ticket más del mismo evento (debe funcionar, total = 4)
  console.log(`\n─────────────────────────────────────────────────────`)
  console.log(`TEST 2: Agregar 1 ticket más (total = 4)`)
  await testAddItem(100, 'Concierto Rock', 2, 'General', 1)
  showCartStatus()
  
  // Test 3: Intentar agregar 1 más (debe fallar, excede límite)
  console.log(`\n─────────────────────────────────────────────────────`)
  console.log(`TEST 3: Intentar agregar 1 más (debe FALLAR)`)
  await testAddItem(100, 'Concierto Rock', 3, 'Platino', 1)
  showCartStatus()
  
  // Test 4: Agregar tickets de OTRO evento (debe funcionar)
  console.log(`\n─────────────────────────────────────────────────────`)
  console.log(`TEST 4: Agregar tickets de OTRO evento (debe funcionar)`)
  await testAddItem(200, 'Festival Jazz', 10, 'Premium', 4)
  showCartStatus()
  
  // Test 5: Intentar agregar 5 tickets de un nuevo evento (debe fallar)
  console.log(`\n─────────────────────────────────────────────────────`)
  console.log(`TEST 5: Intentar agregar 5 tickets de golpe (debe FALLAR)`)
  await testAddItem(300, 'Teatro Musical', 20, 'Balcón', 5)
  showCartStatus()
  
  console.log(`\n✅ Suite de pruebas completada\n`)
}

// Instrucciones
console.log(`
📚 INSTRUCCIONES:

1. Abre la página del carrito o evento
2. Abre la consola del navegador (F12)
3. Ejecuta este código
4. Luego ejecuta: runTests()

COMANDOS DISPONIBLES:
- runTests()           → Ejecutar suite completa
- showCartStatus()     → Ver estado actual del carrito
- testAddItem(...)     → Probar agregar item individual

NOTA: Este script requiere que window.cartContextTest esté disponible.
Si no funciona, es porque el contexto no está expuesto para testing.
`)

// Exportar funciones para uso manual
window.cartTests = {
  runTests,
  showCartStatus,
  testAddItem
}

console.log(`\n✅ Script cargado. Ejecuta: cartTests.runTests()`)
