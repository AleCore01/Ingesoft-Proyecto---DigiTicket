export const mockCity = {
  id: 1,
  name: 'Lima',
};

export const mockDistrict = {
  id: 1,
  name: 'Miraflores',
  cityId: 1,
};

export const mockLocal = {
  id: 1,
  name: 'Teatro Municipal',
  address: 'Av. Principal 123',
  city: 'Lima',
  district: 'Miraflores',
  cityId: 1,
  districtId: 1,
  capacity: 500,
  status: 'ACTIVE',
  contactEmail: 'contacto@teatro.com',
};

export const mockLocalsList = [
  mockLocal,
  {
    id: 2,
    name: 'Centro de Convenciones',
    address: 'Calle Comercio 456',
    city: 'Lima',
    district: 'San Isidro',
    cityId: 1,
    districtId: 2,
    capacity: 1000,
    status: 'ACTIVE',
    contactEmail: 'info@centro.com',
  },
];
