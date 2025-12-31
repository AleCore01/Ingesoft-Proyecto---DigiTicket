// src/services/Dashboard/eventMetricsService.js
import { api } from "../http";
import { EVENT_METRIC_PREFIX } from "../../constants/api";

export const eventMetricsService = {
  getTopEvents: (top) =>
    api.get(`${EVENT_METRIC_PREFIX}/top-events`, {
      params: { top },
    }),
};
