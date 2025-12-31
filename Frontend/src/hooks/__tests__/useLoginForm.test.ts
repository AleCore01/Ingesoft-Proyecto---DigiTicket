import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useLoginForm from '../useLoginForm';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service');

describe('useLoginForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialización', () => {
    it('debería inicializar con estado vacío', () => {
      const { result } = renderHook(() => useLoginForm());

      expect(result.current.formState.data).toEqual({
        email: '',
        password: '',
      });
      expect(result.current.formState.errors).toEqual({});
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  describe('updateField', () => {
    it('debería actualizar email', async () => {
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
      });

      expect(result.current.formState.data.email).toBe('test@example.com');
    });

    it('debería actualizar password', async () => {
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('password', 'password123');
      });

      expect(result.current.formState.data.password).toBe('password123');
    });

  it('debería limpiar errores al actualizar campo', async () => {
    const { result } = renderHook(() => useLoginForm());

    // Generar error primero
    await act(async () => {
      result.current.updateField('email', '');
    });      authService.login.mockRejectedValue(new Error('Error'));

      await act(async () => {
        await result.current.submitForm();
      });

      // Actualizar campo debería limpiar errores
      await act(async () => {
        result.current.updateField('email', 'test@example.com');
      });

      expect(result.current.formState.errors.email).toBeUndefined();
      expect(result.current.formState.errors.general).toBeUndefined();
    });
  });

  describe('Validación', () => {
    it('debería validar email vacío', async () => {
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.formState.errors.email).toBe('El correo electrónico es obligatorio');
    });

    it('debería validar formato de email', async () => {
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'invalid-email');
        result.current.updateField('password', 'password123');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.formState.errors.email).toBe('Formato de correo electrónico inválido');
    });

    it('debería validar password vacío', async () => {
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.formState.errors.password).toBe('La contraseña es obligatoria');
    });

    it('debería validar longitud mínima de password', async () => {
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', '1234567'); // 7 caracteres
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.formState.errors.password).toBe('Debe contener al menos 8 caracteres');
    });

    it('debería pasar validación con datos correctos', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'test-token',
        user: { id: '1', role: 'CLIENT', name: 'Test User' },
      });

      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.formState.errors).toEqual({});
    });
  });

  describe('submitForm', () => {
    it('debería llamar authService.login con credenciales correctas', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'test-token',
        user: { id: '1', role: 'CLIENT', name: 'Test User' },
      });

      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('debería guardar token y user en localStorage', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'test-token-123',
        user: { id: '1', role: 'CLIENT', name: 'Test User' },
      });

      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(localStorage.getItem('token')).toBe('test-token-123');
      expect(localStorage.getItem('user')).toBe(
        JSON.stringify({ id: '1', role: 'CLIENT', name: 'Test User' })
      );
    });

    it('debería manejar respuesta con formato alternativo (token directo)', async () => {
      authService.login.mockResolvedValue({
        token: 'alt-token',
        id: '2',
        role: 'ADMIN',
        name: 'Admin User',
      });

      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'admin@example.com');
        result.current.updateField('password', 'admin123456');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(localStorage.getItem('token')).toBe('alt-token');
      expect(localStorage.getItem('user')).toBe(
        JSON.stringify({ id: '2', role: 'ADMIN', name: 'Admin User' })
      );
    });

    it('debería manejar error de autenticación', async () => {
      authService.login.mockRejectedValue(new Error('Credenciales incorrectas'));

      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'wrongpassword');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.formState.errors.general).toBe('Credenciales incorrectas');
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('debería setear isLoading durante submit', async () => {
      let resolveLogin;
      authService.login.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      act(() => {
        result.current.submitForm();
      });

      await waitFor(() => {
        expect(result.current.formState.isLoading).toBe(true);
      });

      act(() => {
        resolveLogin({
          accessToken: 'token',
          user: { id: '1', role: 'CLIENT', name: 'Test' },
        });
      });

      await waitFor(() => {
        expect(result.current.formState.isLoading).toBe(false);
      });
    });

    it('no debería llamar authService si validación falla', async () => {
      const { result } = renderHook(() => useLoginForm());

      await act(async () => {
        result.current.updateField('email', 'invalid');
        result.current.updateField('password', '123');
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(authService.login).not.toHaveBeenCalled();
    });
  });
});
