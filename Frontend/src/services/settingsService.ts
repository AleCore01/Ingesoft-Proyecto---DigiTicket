import { api } from './http';

export interface SystemSettingsPayload {
  maxTicketsPerPurchase: number;
  pointsToSolesRatio: number;
  pointsExpirationDays: number;
  maxTicketTransfers: number;
  reservationHoldTtlMinutes: number;
  passwordResetTokenTtlMinutes: number;
}

const BASE = 'api/system/settings';

export const settingsService = {
  async get() {
    return api.get<SystemSettingsPayload>(BASE);
  },
  async update(payload: SystemSettingsPayload) {
    return api.put<SystemSettingsPayload>(BASE, payload);
  },
};
