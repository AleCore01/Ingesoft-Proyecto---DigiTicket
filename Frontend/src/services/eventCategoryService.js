// src/services/events.service.js
import { api } from "./http";
import { CATEGORY_PREFIX } from "../constants/api";

export const eventCategoryService = {
  getAll: () => 
    api.get(`${CATEGORY_PREFIX}/all`),
  
  getById: (id) => 
    api.get(`${CATEGORY_PREFIX}/${id}`),
  
  create: (category) => 
    api.post(`${CATEGORY_PREFIX}/add`, category),
  
  update: (id, category) => 
    api.put(`${CATEGORY_PREFIX}/update/${id}`, category),
  
  delete: (id) => 
    api.delete(`${CATEGORY_PREFIX}/delete/${id}`),
  
  searchByName: (name) =>
    api.get(`${CATEGORY_PREFIX}/search/name`, { params: { name } }),
};