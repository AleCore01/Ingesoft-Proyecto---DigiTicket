// src/services/Dashboard/metricsService.js
import { api } from "../http";
import { METRICS_PREFIX } from "../../constants/api";

export const metricsService = {
  getRevenueAndTickets: ({ period = "MONTH", limit } = {}) =>
    api.get(`${METRICS_PREFIX}/revenue-and-tickets`, {
      params: { period, limit },
    }),
};
