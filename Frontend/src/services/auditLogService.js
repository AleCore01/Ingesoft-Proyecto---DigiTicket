import { api } from './http'
import { AUDIT_LOG_PREFIX } from "../constants/api"

export const auditLogService = {

  // 🔹 Obtiene todos los logs de un usuario
  getLogsByUser: (userId) =>
    api.get(`${AUDIT_LOG_PREFIX}/user/${userId}`),

  // 🔹 Obtiene el último log registrado del usuario
  getLastLogByUser: (userId) =>
    api.get(`${AUDIT_LOG_PREFIX}/user/${userId}/last`),

};
