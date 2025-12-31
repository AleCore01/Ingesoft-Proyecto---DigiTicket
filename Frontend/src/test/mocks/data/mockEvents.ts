export const mockEvent = {
  id: 1,
  title: 'Concierto Test',
  description: 'Descripción del evento test',
  date: '2025-12-01T20:00:00Z',
  location: 'Lima, Perú',
  localId: 1,
  categoryId: 1,
  categoryName: 'Conciertos',
  status: 'ACTIVE',
  imageUrl: '/images/event1.jpg',
};

export const mockEventsList = [
  mockEvent,
  {
    id: 2,
    title: 'Teatro Moderno',
    description: 'Obra de teatro contemporánea',
    date: '2025-12-15T19:00:00Z',
    location: 'Arequipa, Perú',
    localId: 2,
    categoryId: 2,
    categoryName: 'Teatro',
    status: 'ACTIVE',
    imageUrl: '/images/event2.jpg',
  },
];

export const mockEventZone = {
  id: 101,
  eventId: 1,
  displayName: 'VIP',
  price: 150.0,
  seatsQuota: 100,
  seatsSold: 20,
  status: 'ACTIVE',
};

export const mockEventZones = [
  mockEventZone,
  {
    id: 102,
    eventId: 1,
    displayName: 'General',
    price: 50.0,
    seatsQuota: 500,
    seatsSold: 50,
    status: 'ACTIVE',
  },
];
