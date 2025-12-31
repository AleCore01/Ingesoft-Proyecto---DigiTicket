// src/services/Dashboard/dashboardService.js
import { api } from "../http";
import { DASHBOARD_PREFIX } from "../../constants/api";

export const dashboardService = {
  getTodaySales: () => api.get(`${DASHBOARD_PREFIX}/sales/today`),
  getTodayTickets: () => api.get(`${DASHBOARD_PREFIX}/tickets/today`),
  getTodayVisits: () => api.get(`${DASHBOARD_PREFIX}/visits/today`),
};
