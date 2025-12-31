import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, beforeEach } from 'vitest';
import { server } from './mocks/server';

// Mock de localStorage para jsdom
const localStorageMock = {
  getItem: (key: string) => {
    return localStorageMock._store[key] || null;
  },
  setItem: (key: string, value: string) => {
    localStorageMock._store[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageMock._store[key];
  },
  clear: () => {
    localStorageMock._store = {};
  },
  _store: {} as Record<string, string>,
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock de location para jsdom
Object.defineProperty(global, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
});

// Mock de alert
global.alert = () => {};

// Establecer el servidor MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Limpiar localStorage antes de cada test
beforeEach(() => {
  localStorageMock.clear();
});

// Limpiar después de cada test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorageMock.clear();
});

// Cerrar el servidor al finalizar
afterAll(() => {
  server.close();
});
