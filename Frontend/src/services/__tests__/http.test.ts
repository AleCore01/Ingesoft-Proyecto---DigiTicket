import { describe, it, expect, beforeEach } from 'vitest';
import { api, ApiError, upload } from '../http';

describe('http.ts - API Helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('ApiError class', () => {
    it('debería crear error con status y data', () => {
      const error = new ApiError('Test error', 404, { detail: 'Not found' });
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.data).toEqual({ detail: 'Not found' });
    });

    it('debería heredar de Error', () => {
      const error = new ApiError('Test', 500);
      
      expect(error).toBeInstanceOf(Error);
    });

    it('debería funcionar sin data opcional', () => {
      const error = new ApiError('Error without data', 400);
      
      expect(error.message).toBe('Error without data');
      expect(error.status).toBe(400);
      expect(error.data).toBeUndefined();
    });

    it('debería tener nombre ApiError', () => {
      const error = new ApiError('Test', 500);
      expect(error.name).toBe('ApiError');
    });
  });

  describe('api helper structure', () => {
    it('api object debería existir y tener métodos HTTP', () => {
      expect(api).toBeDefined();
      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.patch).toBe('function');
      expect(typeof api.delete).toBe('function');
    });

    it('upload helper debería existir', () => {
      expect(typeof upload).toBe('function');
    });
  });
});
