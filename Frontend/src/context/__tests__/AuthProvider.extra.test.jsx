import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';

const createMockJWT = (exp) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp }));
  return `${header}.${payload}.sig`; 
};

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthProvider (extra casos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('carga usuario y token válidos desde localStorage', () => {
    const user = { id: 'u1', name: 'User', role: 'ADMIN' };
    localStorage.setItem('user', JSON.stringify(user));
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem('token', createMockJWT(future));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toEqual(user);
    expect(result.current.hasRole('ADMIN')).toBe(true);
  });

  it('setUser persiste y hasRole funciona con múltiples roles', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Colocar token válido para evitar logout inmediato del efecto
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem('token', createMockJWT(future));
    const newUser = { id: 'u2', name: 'Jane', role: 'SUPER_ADMIN' };
    act(() => { result.current.setUser(newUser); });
    expect(result.current.user).toEqual(newUser);
    expect(result.current.hasRole('ADMIN', 'SUPER_ADMIN')).toBe(true);
  });

  it('logout elimina token y usuario', async () => {
    const user = { id: 'u1', name: 'User', role: 'CLIENT' };
    localStorage.setItem('user', JSON.stringify(user));
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem('token', createMockJWT(future));
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.logout(); });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('efecto de expiración cierra sesión con token ya expirado', () => {
    const user = { id: 'u1', name: 'User', role: 'CLIENT' };
    localStorage.setItem('user', JSON.stringify(user));
    const past = Math.floor(Date.now() / 1000) - 120;
    localStorage.setItem('token', createMockJWT(past));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const locationSpy = vi.spyOn(window.location, 'href', 'set').mockImplementation(() => {});
    renderHook(() => useAuth(), { wrapper });
    // Efecto corre inmediatamente
    expect(alertSpy).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
    alertSpy.mockRestore();
    locationSpy.mockRestore();
  });

  it('efecto maneja token malformado y fuerza logout', () => {
    const user = { id: 'u1', name: 'User', role: 'CLIENT' };
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'token-invalido');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const locationSpy = vi.spyOn(window.location, 'href', 'set').mockImplementation(() => {});
    renderHook(() => useAuth(), { wrapper });
    expect(alertSpy).toHaveBeenCalled();
    expect(localStorage.getItem('user')).toBeNull();
    alertSpy.mockRestore();
    locationSpy.mockRestore();
  });

  it('isTokenExpired retorna false si exp > 60s y true si <60s', () => {
    const futureLong = Math.floor(Date.now() / 1000) + 600; // 10min
    localStorage.setItem('token', createMockJWT(futureLong));
    const { result: r1 } = renderHook(() => useAuth(), { wrapper });
    expect(r1.current.isTokenExpired()).toBe(false);
    const soon = Math.floor(Date.now() / 1000) + 30; // <60s
    localStorage.setItem('token', createMockJWT(soon));
    const { result: r2 } = renderHook(() => useAuth(), { wrapper });
    expect(r2.current.isTokenExpired()).toBe(true);
  });
});
