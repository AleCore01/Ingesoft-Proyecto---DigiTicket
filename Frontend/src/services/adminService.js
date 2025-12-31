import { api } from "./http";
import { ADMIN_PREFIX } from "../constants/api";

export const adminService = {
  getAll: async () => {
    return await api.get(`${ADMIN_PREFIX}`);
  },

  getById: (id) => api.get(`${ADMIN_PREFIX}/${id}`),

  create: (admin) => api.post(`${ADMIN_PREFIX}`, admin),

  update: (id, admin) => api.put(`${ADMIN_PREFIX}/${id}`, admin),

  delete: (id) => api.delete(`${ADMIN_PREFIX}/${id}`),

  searchByName: (name) => api.get(`${ADMIN_PREFIX}/search/name`, { params: { name } }),

  searchByStatus: (status) => api.get(`${ADMIN_PREFIX}/search/status/${status}`)

};
