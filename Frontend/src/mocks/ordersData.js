export const mockOrders = [
  {
    id: 1,
    orderNumber: "ORD-2024-001",
    userId: 1,
    date: "2024-11-10T14:30:00Z",
    status: "completed",
    paymentMethod: "card",
    pointsUsed: 50,
    items: [
      {
        id: 1,
        ticketId: 101,
        eventId: 1,
        eventTitle: "Concierto Rock en Vivo",
        eventImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
        eventDate: "2024-12-15T20:00:00Z",
        eventLocation: "Estadio Nacional",
        zoneName: "VIP",
        quantity: 2,
        unitPrice: 150.00,
        subtotal: 300.00
      },
      {
        id: 2,
        ticketId: 102,
        eventId: 1,
        eventTitle: "Concierto Rock en Vivo",
        eventImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
        eventDate: "2024-12-15T20:00:00Z",
        eventLocation: "Estadio Nacional",
        zoneName: "General",
        quantity: 3,
        unitPrice: 80.00,
        subtotal: 240.00
      }
    ],
    subtotal: 540.00,
    pointsDiscount: 5.00,
    total: 535.00
  },
  {
    id: 2,
    orderNumber: "ORD-2024-002",
    userId: 1,
    date: "2024-11-08T10:15:00Z",
    status: "completed",
    paymentMethod: "yape",
    pointsUsed: 0,
    items: [
      {
        id: 3,
        ticketId: 201,
        eventId: 2,
        eventTitle: "Festival de Comedia Stand Up",
        eventImage: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800",
        eventDate: "2024-11-25T19:00:00Z",
        eventLocation: "Teatro Municipal",
        zoneName: "Platea",
        quantity: 2,
        unitPrice: 65.00,
        subtotal: 130.00
      }
    ],
    subtotal: 130.00,
    pointsDiscount: 0,
    total: 130.00
  },
  {
    id: 3,
    orderNumber: "ORD-2024-003",
    userId: 1,
    date: "2024-11-05T16:45:00Z",
    status: "cancelled",
    paymentMethod: "card",
    pointsUsed: 100,
    items: [
      {
        id: 4,
        ticketId: 301,
        eventId: 3,
        eventTitle: "Torneo de eSports Champions",
        eventImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
        eventDate: "2024-12-01T14:00:00Z",
        eventLocation: "Arena Gaming Center",
        zoneName: "Premium",
        quantity: 1,
        unitPrice: 200.00,
        subtotal: 200.00
      }
    ],
    subtotal: 200.00,
    pointsDiscount: 10.00,
    total: 190.00
  },
  {
    id: 4,
    orderNumber: "ORD-2024-004",
    userId: 1,
    date: "2024-10-28T12:00:00Z",
    status: "completed",
    paymentMethod: "card",
    pointsUsed: 0,
    items: [
      {
        id: 5,
        ticketId: 401,
        eventId: 4,
        eventTitle: "Obra de Teatro Clásico",
        eventImage: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800",
        eventDate: "2024-11-20T18:00:00Z",
        eventLocation: "Teatro Nacional",
        zoneName: "Palco",
        quantity: 2,
        unitPrice: 120.00,
        subtotal: 240.00
      }
    ],
    subtotal: 240.00,
    pointsDiscount: 0,
    total: 240.00
  }
];

export const mockOrderStatuses = [
  { id: 'pending', label: "Pendiente", color: "amber" },
  { id: 'completed', label: "Completada", color: "green" },
  { id: 'cancelled', label: "Cancelada", color: "red" },
  { id: 'refunded', label: "Reembolsada", color: "blue" }
];

export const mockOrderStatusesObj = {
  pending: { label: "Pendiente", color: "amber" },
  completed: { label: "Completada", color: "green" },
  cancelled: { label: "Cancelada", color: "red" },
  refunded: { label: "Reembolsada", color: "blue" }
};
