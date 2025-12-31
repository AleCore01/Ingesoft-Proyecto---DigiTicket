import { http, HttpResponse } from 'msw';
import { AUTH_PREFIX, USERS_PREFIX, LOCAL_PREFIX, CITY_PREFIX, DISTRICT_PREFIX, ADMIN_PREFIX, ORDERS_PREFIX, LOYALTY_PREFIX } from '../../constants/api';
const BASE = 'http://localhost:8080';

export const handlers = [
  // Cities
  http.get(`${BASE}/${CITY_PREFIX}/all`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Lima' },
      { id: 2, name: 'Arequipa' },
    ]);
  }),

  // Districts by city
  http.get(`${BASE}/${DISTRICT_PREFIX}`, ({ request }) => {
    const url = new URL(request.url);
    const cityId = url.searchParams.get('cityId');
    const data = cityId === '1'
      ? [ { id: 10, name: 'Miraflores' }, { id: 11, name: 'San Isidro' } ]
      : [ { id: 20, name: 'Cercado' } ];
    return HttpResponse.json(data);
  }),

  // Locals
  http.get(`${BASE}/${LOCAL_PREFIX}/all`, () => {
    return HttpResponse.json([
      { id: 100, name: 'Estadio Nacional', address: 'Av. José Díaz', city: 'Lima', district: 'Cercado', capacity: 40000 },
    ]);
  }),

  http.post(`${BASE}/${LOCAL_PREFIX}/add`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 101, ...body });
  }),

  // Users basic
  http.get(`${BASE}/${USERS_PREFIX}/me`, () => {
    return HttpResponse.json({ id: 1, name: 'Test User' });
  }),

  // Loyalty sample
  http.get(`${BASE}/${LOYALTY_PREFIX}/history`, () => {
    return HttpResponse.json([
      { id: 'h1', points: 10, occurredAt: '2025-11-01T12:00:00' },
      { id: 'h2', points: 5, occurredAt: '2025-10-20T12:00:00' },
    ]);
  }),

  // Orders sample
  http.get(`${BASE}/${ORDERS_PREFIX}/list`, () => {
    return HttpResponse.json({ data: [] });
  }),

  // Admins sample
  http.post(`${BASE}/${ADMIN_PREFIX}/create`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 900, ...body });
  }),
];
