import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Componente que lanza error para testing
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suprimir console.error durante los tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('debería renderizar children cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('debería mostrar mensaje de error cuando child lanza excepción', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('La aplicación encontró un error inesperado.')).toBeInTheDocument();
  });

  it('debería mostrar detalles técnicos del error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Detalles técnicos')).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('debería mostrar botón para volver al inicio', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /volver al inicio/i });
    expect(button).toBeInTheDocument();
  });

  it('debería mostrar icono de error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verificar que el contenido de error está visible
    const errorMessage = screen.getByText(/algo salió mal/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('debería llamar componentDidCatch cuando ocurre un error', () => {
    const spy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(spy).toHaveBeenCalledWith(
      'ErrorBoundary capturó un error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('debería actualizar el estado cuando getDerivedStateFromError se llama', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verificar que el componente de error está renderizado
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.bg-white.rounded-lg.shadow-lg')).toBeInTheDocument();
  });
});
