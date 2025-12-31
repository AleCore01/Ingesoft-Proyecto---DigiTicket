export const mockCartItem = {
  id: 1,
  eventZoneId: 101,
  eventTitle: 'Concierto Test',
  zoneName: 'VIP',
  quantity: 2,
  unitPrice: 150.0,
  totalPrice: 300.0,
};

export const mockCart = {
  id: 1,
  userId: 1,
  items: [mockCartItem],
  totalItems: 2,
  totalAmount: 300.0,
  createdAt: '2025-11-28T10:00:00Z',
  updatedAt: '2025-11-28T10:00:00Z',
};

export const mockEmptyCart = {
  id: 1,
  userId: 1,
  items: [],
  totalItems: 0,
  totalAmount: 0.0,
  createdAt: '2025-11-28T10:00:00Z',
  updatedAt: '2025-11-28T10:00:00Z',
};
