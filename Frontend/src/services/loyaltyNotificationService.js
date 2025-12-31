import { api } from "./http";
import { LOYALTY_ADMIN_PREFIX } from "../constants/api";

export const loyaltyNotificationService = {
  triggerExpiryNotifications: () =>
    api.post(`${LOYALTY_ADMIN_PREFIX}/notify-expiring`),
};
