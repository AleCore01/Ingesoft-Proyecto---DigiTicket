import { http, HttpResponse } from 'msw';
import { mockUser, mockAdminUser, mockToken } from './data/mockUsers';
import { mockEvent, mockEventsList, mockEventZones } from './data/mockEvents';
import { mockCart, mockEmptyCart } from './data/mockCart';
import { mockOrdersList } from './data/mockOrders';
import { mockCity, mockDistrict, mockLocal, mockLocalsList } from './data/mockLocals';

const BASE_URL = 'http://localhost:8080';

function ensureObject(raw: any): Record<string, any> {
  return typeof raw === 'object' && raw !== null ? raw as Record<string, any> : {};
}

export const handlers = [
  // ==================== AUTH ENDPOINTS ====================
  http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = ensureObject(await request.json());
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!body.email || !emailRegex.test(body.email)) {
      return HttpResponse.json(
        { message: 'Formato de email inválido' },
        { status: 400 }
      );
    }
    
    if (!body.password) {
      return HttpResponse.json(
        { message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    // Aceptar credenciales de test
    if ((body.email === 'test@test.com' || body.email === 'test@example.com') && body.password === 'password123') {
      return HttpResponse.json({
        accessToken: mockToken,
        user: mockUser,
      });
    }
    
    if (body.email === 'admin@test.com' && body.password === 'Admin123!') {
      return HttpResponse.json({
        accessToken: mockToken,
        user: mockAdminUser,
      });
    }
    
    return HttpResponse.json(
      { message: 'Credenciales inválidas' },
      { status: 401 }
    );
  }),

  http.post(`${BASE_URL}/api/auth/register`, async ({ request }) => {
    const body = ensureObject(await request.json());

    // Validar campos según RegisterReq
    if (!body.firstName || !body.lastName || !body.documentType || !body.documentNumber || !body.birthDate || !body.phoneNumber || !body.email || !body.password) {
      return HttpResponse.json(
        { message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return HttpResponse.json(
        { message: 'Formato de email inválido' },
        { status: 400 }
      );
    }
    // Simular creación exitosa (endpoint real devuelve void)
    return HttpResponse.json(null, { status: 201 });
  }),

  http.get(`${BASE_URL}/api/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json(mockUser);
  }),

  http.post(`${BASE_URL}/api/auth/request-reset`, async ({ request }) => {
    const body = ensureObject(await request.json());
    
    if (!body.email) {
      return HttpResponse.json(
        { message: 'Email requerido' },
        { status: 400 }
      );
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return HttpResponse.json(
        { message: 'Formato de email inválido' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      ok: true,
      message: 'Código enviado',
    });
  }),

  http.post(`${BASE_URL}/api/auth/verify-reset-code`, async ({ request }) => {
    const body = ensureObject(await request.json());
    
    if (!body.email || !body.code) {
      return HttpResponse.json(
        { message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    if (body.code === '123456') {
      return HttpResponse.json({ resetToken: 'mock-reset-token-123' });
    }
    
    return HttpResponse.json(
      { message: 'Código inválido' },
      { status: 400 }
    );
  }),

  http.post(`${BASE_URL}/api/auth/reset-password`, async ({ request }) => {
    const body = ensureObject(await request.json());
    
    if (!body.token || !body.password) {
      return HttpResponse.json(
        { message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    // Validar token (acepta tanto mock-reset-token-123 como valid-reset-token)
    if (body.token !== 'mock-reset-token-123' && body.token !== 'valid-reset-token') {
      return HttpResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }
    
    // Validar contraseña
    if (body.password.length < 8) {
      return HttpResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ ok: true, message: 'Contraseña actualizada' });
  }),

  // ==================== CART ENDPOINTS ====================
  http.get(`${BASE_URL}/api/cart`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json(mockCart);
  }),

  http.post(`${BASE_URL}/api/cart/items`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    // Validar: el código envía eventZoneId y qty
    if (!body.eventZoneId) {
      return HttpResponse.json(
        { message: 'Datos inválidos' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      ...mockCart,
      items: [
        ...mockCart.items,
        {
          id: mockCart.items.length + 1,
          eventZoneId: body.eventZoneId,
          quantity: body.quantity,
        },
      ],
    });
  }),

  http.patch(`${BASE_URL}/api/cart/items/:itemId`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    // Validar: el código envía qty, no quantity
    if (body.qty && body.qty <= 0) {
      return HttpResponse.json(
        { message: 'Cantidad inválida' },
        { status: 400 }
      );
    }
    
    // Validar límite de tickets por compra (valor dinámico desde settings)
    // En tests, usamos un valor de ejemplo: 4
    const MAX_TICKETS_PER_PURCHASE = 4;
    if (body.qty && body.qty > MAX_TICKETS_PER_PURCHASE) {
      return HttpResponse.json(
        { message: `No puedes tener más de ${MAX_TICKETS_PER_PURCHASE} tickets por evento` },
        { status: 400 }
      );
    }
    
    return HttpResponse.json(mockCart);
  }),

  http.delete(`${BASE_URL}/api/cart/items/:itemId`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json(mockEmptyCart);
  }),

  http.delete(`${BASE_URL}/api/cart/clear`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true });
  }),

  http.post(`${BASE_URL}/api/cart/hold`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true, holdId: 1 });
  }),

  http.post(`${BASE_URL}/api/checkout`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    if (!body.cardToken && !body.paymentMethod) {
      return HttpResponse.json(
        { message: 'Datos de pago incompletos' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      orderId: 1,
      status: 'COMPLETED',
      total: mockCart.totalAmount,
    });
  }),

  // ==================== EVENTS ENDPOINTS ====================
  http.get(`${BASE_URL}/api/event/all`, () => {
    return HttpResponse.json(mockEventsList);
  }),

  // IMPORTANTE: /api/event/search DEBE ir ANTES de /api/event/:id
  // para que MSW no confunda "search" como un ID
  http.get(`${BASE_URL}/api/event/search`, ({ request }) => {
    const url = new URL(request.url);
    const title = url.searchParams.get('title');
    const status = url.searchParams.get('status');
    const locationId = url.searchParams.get('locationId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    
    let results = mockEventsList;
    
    if (title) {
      results = results.filter(e => 
        e.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    
    if (status) {
      results = results.filter(e => e.status === status);
    }
    
    if (locationId) {
      results = results.filter(e => e.localId === Number(locationId));
    }
    
    if (from || to) {
      results = results.filter(e => {
        const eventDate = new Date(e.date);
        if (from && eventDate < new Date(from)) return false;
        if (to && eventDate > new Date(to)) return false;
        return true;
      });
    }
    
    return HttpResponse.json(results);
  }),

  http.get(`${BASE_URL}/api/event/:id`, ({ params }) => {
    const event = mockEventsList.find(e => e.id === Number(params.id));
    
    if (!event) {
      return HttpResponse.json(
        { message: 'Evento no encontrado' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(event);
  }),

  http.post(`${BASE_URL}/api/event/add`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    // Aceptar tanto campos nuevos (startsAt, eventCategoryId) como antiguos (date, categoryId)
    const hasDate = body.startsAt || body.date;
    const hasCategory = body.eventCategoryId || body.categoryId;
    
    if (!body.title || !hasDate || !hasCategory) {
      return HttpResponse.json(
        { message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json(
      { ...mockEvent, ...body, id: mockEventsList.length + 1 },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/api/event/update/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    const event = mockEventsList.find(e => e.id === Number(params.id));
    
    if (!event) {
      return HttpResponse.json(
        { message: 'Evento no encontrado' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ ...event, ...body });
  }),

  http.delete(`${BASE_URL}/api/event/delete/:id`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true });
  }),

  http.post(`${BASE_URL}/api/event/:id/publish`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true, status: 'PUBLISHED' });
  }),

  http.post(`${BASE_URL}/api/event/:id/cancel`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true, status: 'CANCELLED' });
  }),

  http.post(`${BASE_URL}/api/event/:id/finish`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true, status: 'FINISHED' });
  }),

  http.post(`${BASE_URL}/api/bulk/events`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || !file.name.endsWith('.csv')) {
      return HttpResponse.json(
        { message: 'Archivo inválido' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ ok: true, imported: 5 });
  }),

  // ==================== ORDERS ENDPOINTS ====================
  http.get(`${BASE_URL}/api/orders/user/:userId`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const userId = Number(params.userId);
    const userOrders = mockOrdersList.filter(o => o.userId === userId);
    
    // Devolver array vacío si no hay órdenes, no error
    return HttpResponse.json(userOrders);
  }),

  http.get(`${BASE_URL}/api/orders/:id`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const order = mockOrdersList.find(o => o.id === Number(params.id));
    
    if (!order) {
      return HttpResponse.json(
        { message: 'Orden no encontrada' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(order);
  }),

  // ==================== LOCALS ENDPOINTS ====================
  http.get(`${BASE_URL}/api/local/all`, () => {
    return HttpResponse.json(mockLocalsList);
  }),

  http.get(`${BASE_URL}/api/locals/all`, () => {
    return HttpResponse.json(mockLocalsList);
  }),

  http.get(`${BASE_URL}/api/local/:id`, ({ params }) => {
    const local = mockLocalsList.find(l => l.id === Number(params.id));
    
    if (!local) {
      return HttpResponse.json(
        { message: 'Local no encontrado' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(local);
  }),

  http.get(`${BASE_URL}/api/locals/:id`, ({ params }) => {
    const local = mockLocalsList.find(l => l.id === Number(params.id));
    
    if (!local) {
      return HttpResponse.json(
        { message: 'Local no encontrado' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(local);
  }),

  http.post(`${BASE_URL}/api/local/add`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    if (!body.name || !body.address || !body.cityId || !body.districtId) {
      return HttpResponse.json(
        { message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json(
      { ...mockLocal, ...body, id: mockLocalsList.length + 1 },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/api/local/update/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    const local = mockLocalsList.find(l => l.id === Number(params.id));
    
    if (!local) {
      return HttpResponse.json(
        { message: 'Local no encontrado' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ ...local, ...body });
  }),

  http.delete(`${BASE_URL}/api/local/delete/:id`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true });
  }),

  http.get(`${BASE_URL}/api/local/search/name`, ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    if (!name) return HttpResponse.json(mockLocalsList);
    const results = mockLocalsList.filter(l =>
      l.name.toLowerCase().includes(name.toLowerCase())
    );
    return HttpResponse.json(results);
  }),

  http.get(`${BASE_URL}/api/local/search/status/:status`, ({ params }) => {
    const results = mockLocalsList.filter(l => l.status === params.status);
    return HttpResponse.json(results);
  }),

  http.get(`${BASE_URL}/api/local/search/district`, ({ request }) => {
    const url = new URL(request.url);
    const district = url.searchParams.get('district');
    if (!district) return HttpResponse.json(mockLocalsList);
    const results = mockLocalsList.filter(l =>
      l.district.toLowerCase().includes(district.toLowerCase())
    );
    return HttpResponse.json(results);
  }),

  http.get(`${BASE_URL}/api/local/:id/event/count`, () => {
    // Mock: retornar número aleatorio de eventos
    return HttpResponse.json(Math.floor(Math.random() * 10));
  }),

  http.get(`${BASE_URL}/api/city/all`, () => {
    return HttpResponse.json([mockCity]);
  }),

  http.get(`${BASE_URL}/api/cities/all`, () => {
    return HttpResponse.json([mockCity]);
  }),

  http.get(`${BASE_URL}/api/district`, ({ request }) => {
    const url = new URL(request.url);
    const cityId = url.searchParams.get('cityId');
    
    if (cityId) {
      const districts = [mockDistrict].filter(d => d.cityId === Number(cityId));
      return HttpResponse.json(districts);
    }
    
    return HttpResponse.json([mockDistrict]);
  }),

  http.get(`${BASE_URL}/api/districts`, ({ request }) => {
    const url = new URL(request.url);
    const cityId = url.searchParams.get('cityId');
    
    if (cityId) {
      const districts = [mockDistrict].filter(d => d.cityId === Number(cityId));
      return HttpResponse.json(districts);
    }
    
    return HttpResponse.json([mockDistrict]);
  }),

  http.post(`${BASE_URL}/api/bulk/locals`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || !file.name.endsWith('.csv')) {
      return HttpResponse.json(
        { message: 'Archivo inválido' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ ok: true, imported: 3 });
  }),

  // ==================== TICKETS / EVENT ZONES ENDPOINTS ====================
  http.get(`${BASE_URL}/api/event/:eventId/tickets`, ({ params }) => {
    // Mock de tickets para un evento (adaptado desde eventZones)
    const eventId = Number(params.eventId);
    
    // Si el evento no existe, devolver array vacío (fallback a eventZoneService)
    if (eventId === 9999) {
      return HttpResponse.json(
        { message: 'Evento no encontrado' },
        { status: 404 }
      );
    }
    
    const mockTickets = mockEventZones
      .filter(zone => zone.eventId === eventId || eventId === 1)
      .map(zone => ({
        id: zone.id,
        eventId: eventId,
        name: zone.displayName,
        price: zone.price,
        stockAvailable: zone.seatsQuota - zone.seatsSold,
      }));
    
    return HttpResponse.json(mockTickets);
  }),

  http.get(`${BASE_URL}/api/tickets/:id`, ({ params }) => {
    const ticketId = Number(params.id);
    const zone = mockEventZones.find(z => z.id === ticketId);
    
    if (!zone) {
      return HttpResponse.json(
        { message: 'Ticket no encontrado' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      id: zone.id,
      eventId: zone.eventId,
      name: zone.displayName,
      price: zone.price,
      stockAvailable: zone.seatsQuota - zone.seatsSold,
    });
  }),

  // ==================== EVENT ZONE ENDPOINTS (rutas específicas primero) ====================
  http.get(`${BASE_URL}/api/eventzone/all`, () => {
    return HttpResponse.json(mockEventZones);
  }),

  http.get(`${BASE_URL}/api/eventzone/available`, ({ request }) => {
    const url = new URL(request.url);
    const eventId = Number(url.searchParams.get('eventId'));
    const zoneId = Number(url.searchParams.get('zoneId'));
    
    const zone = mockEventZones.find(z => 
      z.id === zoneId && z.eventId === eventId
    );
    
    if (!zone) {
      return HttpResponse.json(0);
    }
    
    return HttpResponse.json(zone.seatsQuota - zone.seatsSold);
  }),

  http.get(`${BASE_URL}/api/eventzone/list/:eventId`, ({ params }) => {
    const eventId = Number(params.eventId);
    const zones = mockEventZones.filter(z => z.eventId === eventId || eventId === 1);
    
    // Devolver array vacío si no hay zones, no error
    return HttpResponse.json(zones.length > 0 ? zones : []);
  }),

  http.get(`${BASE_URL}/api/eventzone/:id`, ({ params }) => {
    const zoneId = Number(params.id);
    const zone = mockEventZones.find(z => z.id === zoneId);
    
    if (!zone) {
      return HttpResponse.json(
        { message: 'Zona no encontrada' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(zone);
  }),

  // ==================== EVENTZONE CRUD ====================
  http.post(`${BASE_URL}/api/eventzone/add`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    return HttpResponse.json({
      id: mockEventZones.length + 1,
      ...body,
    }, { status: 201 });
  }),

  http.put(`${BASE_URL}/api/eventzone/update/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    const zone = mockEventZones.find(z => z.id === Number(params.id));
    
    if (!zone) {
      return HttpResponse.json(
        { message: 'Zona no encontrada' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ ...zone, ...body });
  }),

  http.delete(`${BASE_URL}/api/eventzone/delete/:id`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true });
  }),

  http.post(`${BASE_URL}/api/bulk/zones`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File) || !file.name.endsWith('.csv')) {
      return HttpResponse.json(
        { message: 'Archivo inválido' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ ok: true, imported: 4 });
  }),

  // ==================== EVENT CATEGORY ENDPOINTS ====================
  http.get(`${BASE_URL}/api/eventcategory/all`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Conciertos', description: 'Eventos musicales' },
      { id: 2, name: 'Deportes', description: 'Eventos deportivos' },
      { id: 3, name: 'Teatro', description: 'Obras de teatro' },
    ]);
  }),

  http.get(`${BASE_URL}/api/eventcategory/:id`, ({ params }) => {
    const categories = [
      { id: 1, name: 'Conciertos', description: 'Eventos musicales' },
      { id: 2, name: 'Deportes', description: 'Eventos deportivos' },
      { id: 3, name: 'Teatro', description: 'Obras de teatro' },
    ];
    
    const category = categories.find(c => c.id === Number(params.id));
    
    if (!category) {
      return HttpResponse.json(
        { message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(category);
  }),

  http.post(`${BASE_URL}/api/eventcategory/add`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    return HttpResponse.json({
      id: 10,
      ...body,
    }, { status: 201 });
  }),

  http.put(`${BASE_URL}/api/eventcategory/update/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = ensureObject(await request.json());
    
    return HttpResponse.json({
      id: Number(params.id),
      ...body,
    });
  }),

  http.delete(`${BASE_URL}/api/eventcategory/delete/:id`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ ok: true });
  }),

  http.get(`${BASE_URL}/api/eventcategory/search/name`, ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    
    const categories = [
      { id: 1, name: 'Conciertos', description: 'Eventos musicales' },
      { id: 2, name: 'Deportes', description: 'Eventos deportivos' },
    ];
    
    if (!name) {
      return HttpResponse.json(categories);
    }
    
    const filtered = categories.filter(c => 
      c.name.toLowerCase().includes(name.toLowerCase())
    );
    
    return HttpResponse.json(filtered);
  }),

  // ==================== LOYALTY ENDPOINTS ====================
  http.get(`${BASE_URL}/api/loyalty/balance`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      current: 500,
      redeemable: 450,
      pending: 50,
    });
  }),

  // ==================== USER PROFILE & LOYALTY (points) ENDPOINTS ====================
  http.get(`${BASE_URL}/api/users/:userId/profile`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const userId = params.userId;
    if (!userId || userId === 'null' || userId === 'undefined') {
      return HttpResponse.json({ message: 'userId inválido' }, { status: 400 });
    }
    // Perfil básico simulado
    return HttpResponse.json({
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      phoneNumber: '999888777',
      preferences: { notifications: true, newsletter: false }
    });
  }),

  http.put(`${BASE_URL}/api/users/:userId/profile`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const userId = params.userId;
    if (!userId || userId === 'null' || userId === 'undefined') {
      return HttpResponse.json({ message: 'userId inválido' }, { status: 400 });
    }
    const body = ensureObject(await request.json());
    // Validaciones mínimas: si se envía phoneNumber debe ser numérico
    if (body.phoneNumber && /[^0-9]/.test(body.phoneNumber)) {
      return HttpResponse.json({ message: 'phoneNumber inválido' }, { status: 400 });
    }
    return HttpResponse.json({
      id: userId,
      firstName: body.firstName || 'John',
      lastName: body.lastName || 'Doe',
      email: 'john.doe@test.com',
      phoneNumber: body.phoneNumber || '999888777'
    });
  }),

  // Balance de puntos esperado por el servicio (nota: distinto de /api/loyalty/balance)
  http.get(`${BASE_URL}/api/loyalty/points/balance`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    if (!clientId) {
      return HttpResponse.json({ message: 'clientId requerido' }, { status: 400 });
    }
    return HttpResponse.json({ totalPoints: 250 });
  }),

  http.get(`${BASE_URL}/api/loyalty/points/history`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    if (!clientId) {
      return HttpResponse.json([], { status: 200 });
    }
    // Historial simulado
    const history = [
      { id: 1, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), description: 'Compra de entradas', status: 'ACTIVE', points: 50, type: 'earned', balance: 250 },
      { id: 2, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), description: 'Redención de puntos', status: 'USED', points: -30, type: 'redeemed', balance: 200 },
      { id: 3, createdAt: new Date().toISOString(), description: 'Bono de bienvenida', status: 'ACTIVE', points: 80, type: 'earned', balance: 280 }
    ];
    return HttpResponse.json(history);
  }),

  // ==================== ADMIN CLIENTS ENDPOINTS ====================
  http.get(`${BASE_URL}/api/admin/clients`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const url = new URL(request.url);
    const name = url.searchParams.get('name')?.trim();
    const clients = [
      { id: 1, name: 'John', pointsStatus: 'ACTIVE' },
      { id: 2, name: 'Maria', pointsStatus: 'EXPIRING_SOON' },
      { id: 3, name: 'Carlos', pointsStatus: 'EXPIRED' }
    ];
    const filtered = name ? clients.filter(c => c.name.toLowerCase().includes(name.toLowerCase())) : clients;
    return HttpResponse.json(filtered);
  }),

  http.delete(`${BASE_URL}/api/admin/clients/:clientId`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    if (!params.clientId || params.clientId === 'null') {
      return HttpResponse.json({ message: 'clientId inválido' }, { status: 400 });
    }
    return HttpResponse.json({ ok: true });
  }),

  http.get(`${BASE_URL}/api/admin/clients/by-points-status`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const name = url.searchParams.get('name')?.trim();
    const allowed = ['EXPIRED', 'EXPIRING_SOON', 'ACTIVE'];
    if (!status || !allowed.includes(status)) {
      return HttpResponse.json({ message: 'Estado inválido' }, { status: 400 });
    }
    const clients = [
      { id: 1, name: 'John', pointsStatus: 'ACTIVE' },
      { id: 2, name: 'Maria', pointsStatus: 'EXPIRING_SOON' },
      { id: 3, name: 'Carlos', pointsStatus: 'EXPIRED' },
      { id: 4, name: 'Maria Fernanda', pointsStatus: 'ACTIVE' }
    ];
    let filtered = clients.filter(c => c.pointsStatus === status);
    if (name) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));
    }
    return HttpResponse.json(filtered);
  }),

  http.get(`${BASE_URL}/api/admin/clients/points-expiring-in-5-days`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const soon = [
      { id: 5, name: 'Lucia', expiringInDays: 3 },
      { id: 6, name: 'Pedro', expiringInDays: 2 }
    ];
    return HttpResponse.json(soon);
  }),

  // ==================== ADMIN USER (CRUD) ENDPOINTS ====================
  http.get(`${BASE_URL}/api/admins`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const admins = [
      { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@test.com', status: 'ACTIVE' },
      { id: 2, firstName: 'John', lastName: 'Doe', email: 'john@admin.com', status: 'ACTIVE' }
    ];
    return HttpResponse.json(admins);
  }),

  http.get(`${BASE_URL}/api/admins/:id`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const adminId = Number(params.id);
    if (!adminId || isNaN(adminId)) {
      return HttpResponse.json({ message: 'Admin no encontrado' }, { status: 404 });
    }
    return HttpResponse.json({ id: adminId, firstName: 'Admin', lastName: 'User', email: 'admin@test.com' });
  }),

  http.post(`${BASE_URL}/api/admins`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const body = ensureObject(await request.json());
    if (!body.firstName || !body.email) {
      return HttpResponse.json({ message: 'Campos requeridos faltantes' }, { status: 400 });
    }
    return HttpResponse.json({ id: 10, ...body }, { status: 201 });
  }),

  http.put(`${BASE_URL}/api/admins/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const adminId = Number(params.id);
    if (!adminId || isNaN(adminId)) {
      return HttpResponse.json({ message: 'Admin no encontrado' }, { status: 404 });
    }
    const body = ensureObject(await request.json());
    return HttpResponse.json({ id: adminId, ...body });
  }),

  http.delete(`${BASE_URL}/api/admins/:id`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const adminId = Number(params.id);
    if (!adminId || isNaN(adminId)) {
      return HttpResponse.json({ message: 'Admin no encontrado' }, { status: 404 });
    }
    return HttpResponse.json({ ok: true });
  }),

  http.get(`${BASE_URL}/api/admins/search/name`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const admins = [
      { id: 1, firstName: 'Admin', lastName: 'User', status: 'ACTIVE' },
      { id: 2, firstName: 'John', lastName: 'Doe', status: 'ACTIVE' }
    ];
    if (!name) return HttpResponse.json(admins);
    const filtered = admins.filter(a => a.firstName.toLowerCase().includes(name.toLowerCase()));
    return HttpResponse.json(filtered);
  }),

  http.get(`${BASE_URL}/api/admins/search/status/:status`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const status = params.status;
    // Validar estados permitidos (mismo patrón que admins de clientes)
    const allowed = ['ACTIVE', 'INACTIVE'];
    if (!allowed.includes(status as string)) {
      return HttpResponse.json({ message: 'Estado inválido' }, { status: 400 });
    }
    const admins = [
      { id: 1, firstName: 'Admin', status: 'ACTIVE' },
      { id: 2, firstName: 'Inactive', status: 'INACTIVE' }
    ];
    const filtered = admins.filter(a => a.status === status);
    return HttpResponse.json(filtered);
  }),
];
