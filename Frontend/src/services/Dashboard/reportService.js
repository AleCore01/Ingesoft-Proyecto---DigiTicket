// src/services/Dashboard/reportService.js
import { api } from "../http";
import { REPORT_PREFIX } from "../../constants/api";

export const reportService = {
  // Dashboard en JSON
  getDashboard: (period = "DAY") =>
    api.get(REPORT_PREFIX, {
      params: { period }, // DAY | WEEK | MONTH | YEAR
    }),

  // PDF 
  downloadPdf: async (period = "DAY") => {
    const url = `${REPORT_PREFIX}/pdf?period=${period}`;
    const res = await fetch(url, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al descargar PDF`);
    }

    // Devuelve Blob
    return await res.blob();
  },

  // CSV 
  downloadCsv: async (period = "DAY") => {
    const url = `${REPORT_PREFIX}/csv?period=${period}`;
    const res = await fetch(url, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al descargar CSV`);
    }

    return await res.blob();
  },
};