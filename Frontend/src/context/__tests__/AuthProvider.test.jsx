import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, useTokenCheck } from '../../context/AuthProvider';

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('debería inicializar sin usuario cuando localStorage está vacío', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toBeNull();
    });

    it.skip('debería cargar usuario desde localStorage', async () => {
      const mockUser = { id: '123', name: 'John Doe', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const validTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockJWT(validTime);
      localStorage.setItem('token', validToken);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('debería manejar JSON inválido en localStorage', () => {
      localStorage.setItem('user', 'invalid-json');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('setUser', () => {
    it.skip('debería actualizar el usuario y guardar en localStorage', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const newUser = { id: '456', name: 'Jane Doe', role: 'ADMIN' };

      await act(async () => {
        result.current.setUser(newUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(newUser);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(newUser));
      });
    });

    it('debería limpiar localStorage cuando setUser(null)', () => {
      const mockUser = { id: '123', name: 'John', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it.skip('debería manejar errores silenciosamente al guardar', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Mock localStorage.setItem para lanzar error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const newUser = { id: '789', name: 'Test', role: 'CLIENT' };

      await act(async () => {
        result.current.setUser(newUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(newUser);
      });
    });
  });

  describe('hasRole', () => {
    it.skip('debería verificar rol único', async () => {
      const mockUser = { id: '123', name: 'Admin User', role: 'ADMIN' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const validTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockJWT(validTime);
      localStorage.setItem('token', validToken);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.hasRole('ADMIN')).toBe(true);
        expect(result.current.hasRole('CLIENT')).toBe(false);
      });
    });

    it.skip('debería verificar múltiples roles', async () => {
      const mockUser = { id: '123', name: 'Super Admin', role: 'SUPER_ADMIN' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const validTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockJWT(validTime);
      localStorage.setItem('token', validToken);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.hasRole('ADMIN', 'SUPER_ADMIN')).toBe(true);
        expect(result.current.hasRole('CLIENT', 'ADMIN')).toBe(false);
      });
    });

    it('debería retornar false sin usuario', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.hasRole('ADMIN')).toBe(false);
    });

    it('debería retornar false con array vacío', () => {
      const mockUser = { id: '123', name: 'User', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.hasRole()).toBe(false);
    });
  });

  describe('logout', () => {
    it('debería limpiar usuario y token', () => {
      const mockUser = { id: '123', name: 'John', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-token');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('debería retornar true sin token', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isTokenExpired()).toBe(true);
    });

    it('debería retornar true con token expirado', () => {
      // Token que expiró hace 1 hora
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createMockJWT(expiredTime);
      localStorage.setItem('token', expiredToken);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isTokenExpired()).toBe(true);
    });

    it('debería retornar true con token que expira en menos de 1 minuto', () => {
      // Token que expira en 30 segundos
      const expiringTime = Math.floor(Date.now() / 1000) + 30;
      const expiringToken = createMockJWT(expiringTime);
      localStorage.setItem('token', expiringToken);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isTokenExpired()).toBe(true);
    });

    it('debería retornar false con token válido', () => {
      // Token que expira en 1 hora
      const validTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockJWT(validTime);
      localStorage.setItem('token', validToken);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isTokenExpired()).toBe(false);
    });

    it('debería retornar true con token malformado', () => {
      localStorage.setItem('token', 'invalid-token');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isTokenExpired()).toBe(true);
    });
  });

  describe('Token Expiration Monitoring', () => {
    it('debería verificar expiración periódicamente (cada 60s)', async () => {
      const mockUser = { id: '123', name: 'John', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const validTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockJWT(validTime);
      localStorage.setItem('token', validToken);

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const locationSpy = vi.spyOn(window.location, 'href', 'set').mockImplementation(() => {});

      renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Avanzar 60 segundos
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      // No debería haber alerta con token válido
      expect(alertSpy).not.toHaveBeenCalled();
      
      alertSpy.mockRestore();
      locationSpy.mockRestore();
    });

    it.skip('debería cerrar sesión cuando el token expira', async () => {
      const mockUser = { id: '123', name: 'John', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // Token que expira en 30 segundos (menos de 1 minuto, se considera expirado)
      const expiringTime = Math.floor(Date.now() / 1000) + 30;
      const expiringToken = createMockJWT(expiringTime);
      localStorage.setItem('token', expiringToken);

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const locationSpy = vi.spyOn(window.location, 'href', 'set').mockImplementation(() => {});

      renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // El useEffect detecta token expirado y limpia
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      }, { timeout: 10000 });

      expect(localStorage.getItem('token')).toBeNull();
      
      alertSpy.mockRestore();
      locationSpy.mockRestore();
    }, 15000);
  });

  describe('useTokenCheck hook', () => {
    it('debería ejecutar operación si el token es válido', () => {
      const validTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockJWT(validTime);
      localStorage.setItem('token', validToken);

      const mockUser = { id: '123', name: 'John', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const mockOperation = vi.fn();
      const { result } = renderHook(() => useTokenCheck(), {
        wrapper: AuthProvider
      });

      act(() => {
        result.current.checkAndProceed(mockOperation);
      });

      expect(mockOperation).toHaveBeenCalled();
    });

    it('debería bloquear operación y cerrar sesión si el token expiró', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createMockJWT(expiredTime);
      localStorage.setItem('token', expiredToken);

      const mockUser = { id: '123', name: 'John', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const locationSpy = vi.spyOn(window.location, 'href', 'set').mockImplementation(() => {});

      const mockOperation = vi.fn();
      const { result } = renderHook(() => useTokenCheck(), {
        wrapper: AuthProvider
      });

      act(() => {
        result.current.checkAndProceed(mockOperation);
      });

      expect(mockOperation).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('sesión ha expirado'));
      expect(locationSpy).toHaveBeenCalledWith('/login');
      
      alertSpy.mockRestore();
      locationSpy.mockRestore();
    });

    it('debería soportar operaciones asíncronas', async () => {
      const validTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createMockJWT(validTime);
      localStorage.setItem('token', validToken);

      const mockUser = { id: '123', name: 'John', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const mockAsyncOperation = vi.fn().mockResolvedValue('success');
      const { result } = renderHook(() => useTokenCheck(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        await result.current.checkAndProceed(mockAsyncOperation);
      });

      expect(mockAsyncOperation).toHaveBeenCalled();
    });
  });
});

// Helper function to create mock JWT tokens
function createMockJWT(exp) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp }));
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
}
