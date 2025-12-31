export const mockUserProfile = {
  id: 1,
  firstName: "Juan",
  lastName: "Pérez García",
  email: "juan.perez@example.com",
  phone: "+51 987 654 321",
  documentType: "DNI",
  documentNumber: "12345678",
  birthDate: "1995-06-15",
  gender: "M",
  address: {
    street: "Av. Arequipa 1234",
    district: "Miraflores",
    city: "Lima",
    country: "Perú",
    postalCode: "15074"
  },
  loyaltyPoints: 250,
  totalPurchases: 4,
  totalSpent: 1095.00,
  memberSince: "2024-01-15T00:00:00Z",
  preferences: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    favoriteCategories: ["Música", "Teatro", "Deportes"]
  },
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan"
};

export const mockLoyaltyHistory = [
  {
    id: 1,
    date: "2024-11-10T14:30:00Z",
    description: "Compra - Orden #ORD-2024-001",
    points: 53,
    type: "earned",
    balance: 250
  },
  {
    id: 2,
    date: "2024-11-10T14:30:00Z",
    description: "Canje en compra",
    points: -50,
    type: "redeemed",
    balance: 197
  },
  {
    id: 3,
    date: "2024-11-08T10:15:00Z",
    description: "Compra - Orden #ORD-2024-002",
    points: 13,
    type: "earned",
    balance: 247
  },
  {
    id: 4,
    date: "2024-10-28T12:00:00Z",
    description: "Compra - Orden #ORD-2024-004",
    points: 24,
    type: "earned",
    balance: 234
  },
  {
    id: 5,
    date: "2024-10-15T09:00:00Z",
    description: "Bono de bienvenida",
    points: 100,
    type: "bonus",
    balance: 210
  }
];
