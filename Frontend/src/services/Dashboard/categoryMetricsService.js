// src/services/Dashboard/categoryMetricsService.js
import { api } from "../http";
import { CATEGORY_METRICS_PREFIX } from "../../constants/api";

export const categoryMetricsService = {
  getTopCategories: (limit) =>
    api.get(`${CATEGORY_METRICS_PREFIX}/top-categories`, { params: { limit }, }),
};
