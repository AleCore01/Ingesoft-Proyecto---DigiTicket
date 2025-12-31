import { api } from "./http";

export const healthService = {
  // timeout corto para no quedarnos colgados si el back cae
  ping: () => api.get<string>("hello", { timeout: 5000 }),
};
