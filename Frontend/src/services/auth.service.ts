import { api } from "./http";
import { AUTH_PREFIX } from "../constants/api";
import type { LoginRes, RegisterReq, User } from "../types/auth";

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginRes>(`${AUTH_PREFIX}/login`, { email, password }),

  register: (payload: RegisterReq) =>
    api.post<void>(`${AUTH_PREFIX}/register`, payload),

  me: () => api.get<User>(`${AUTH_PREFIX}/me`),

  requestReset: (email: string) =>
    api.post<void>(`${AUTH_PREFIX}/request-reset`, { email }),

  verifyCode: (email: string, code: string) =>
    api.post<{ resetToken: string }>(`${AUTH_PREFIX}/verify-reset-code`, { email, code }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<void>(`${AUTH_PREFIX}/reset-password`, { // <-- Usa el prefijo
      token,
      password: newPassword,
    }),
};
