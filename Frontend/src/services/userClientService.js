import { api } from "./http";
import { ADMIN_CLIENT_PREFIX } from "../constants/api";

export const POINTS_STATUS_ENUM = {
  expirados: "EXPIRED",         
  "por vencer": "EXPIRING_SOON", 
  vigentes: "ACTIVE",          
};

export const userClientService = {
  getActiveClients: (name) =>
    api.get(ADMIN_CLIENT_PREFIX, {
      params: name && name.trim() ? { name: name.trim() } : undefined,
    }),

  deactivateClient: (clientId) =>
    api.delete(`${ADMIN_CLIENT_PREFIX}/${clientId}`),

  // Listar clientes filtrados por estado de puntos
  getClientsByPointsStatus: (statusEnum, name) =>
    api.get(`${ADMIN_CLIENT_PREFIX}/by-points-status`, {
      params: {
        status: statusEnum,
        ...(name && name.trim() ? { name: name.trim() } : {}),
      },
    }),

  // Clientes con puntos que vencen en los próximos 5 días
  getClientsWithPointsExpiringIn5Days: () =>
    api.get(`${ADMIN_CLIENT_PREFIX}/points-expiring-in-5-days`),
};