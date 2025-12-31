export const mockOrder = {
  id: 1,
  userId: 1,
  orderNumber: 'ORD-2025-001',
  status: 'COMPLETED',
  totalAmount: 300.0,
  items: [
    {
      id: 1,
      eventTitle: 'Concierto Test',
      zoneName: 'VIP',
      quantity: 2,
      unitPrice: 150.0,
      totalPrice: 300.0,
    },
  ],
  date: '2025-11-28T10:00:00Z',
  createdAt: '2025-11-28T10:00:00Z',
  updatedAt: '2025-11-28T10:30:00Z',
};

export const mockOrdersList = [
  mockOrder,
  {
    id: 2,
    userId: 1,
    orderNumber: 'ORD-2025-002',
    status: 'PENDING',
    totalAmount: 100.0,
    items: [
      {
        id: 2,
        eventTitle: 'Teatro Moderno',
        zoneName: 'General',
        quantity: 2,
        unitPrice: 50.0,
        totalPrice: 100.0,
      },
    ],
    date: '2025-11-27T15:00:00Z',
    createdAt: '2025-11-27T15:00:00Z',
    updatedAt: '2025-11-27T15:00:00Z',
  },
];
