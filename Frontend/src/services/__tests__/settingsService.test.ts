import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsService } from '../settingsService';

// Mock http module
vi.mock('../http', () => {
  return {
    api: {
      get: vi.fn(),
      put: vi.fn()
    }
  };
});

import { api } from '../http';

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('get retorna payload esperado', async () => {
    const payload = {
      maxTicketsPerPurchase: 10,
      pointsToSolesRatio: 2,
      pointsExpirationDays: 90,
      maxTicketTransfers: 3,
      reservationHoldTtlMinutes: 15,
      passwordResetTokenTtlMinutes: 30
    };
    (api.get as any).mockResolvedValue(payload);
    const data = await settingsService.get();
    expect(api.get).toHaveBeenCalledWith('api/system/settings');
    expect(data).toEqual(payload);
  });

  it('get propaga error en fallo', async () => {
    (api.get as any).mockRejectedValue(new Error('Network')); 
    await expect(settingsService.get()).rejects.toThrow('Network');
  });

  it('update envía payload y retorna respuesta', async () => {
    const payload = {
      maxTicketsPerPurchase: 5,
      pointsToSolesRatio: 1,
      pointsExpirationDays: 30,
      maxTicketTransfers: 2,
      reservationHoldTtlMinutes: 10,
      passwordResetTokenTtlMinutes: 45
    };
    (api.put as any).mockResolvedValue({ ...payload, updated: true });
    const data = await settingsService.update(payload);
    expect(api.put).toHaveBeenCalledWith('api/system/settings', payload);
    expect(data).toHaveProperty('updated', true);
  });

  it('update propaga error en fallo', async () => {
    (api.put as any).mockRejectedValue(new Error('Fail')); 
    await expect(settingsService.update({} as any)).rejects.toThrow('Fail');
  });
});