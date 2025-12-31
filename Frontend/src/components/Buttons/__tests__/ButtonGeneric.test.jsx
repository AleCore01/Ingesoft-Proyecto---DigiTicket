import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonGeneric from '../ButtonGeneric';

describe('ButtonGeneric', () => {
  it('debería renderizar el botón con children', () => {
    render(<ButtonGeneric>Click me</ButtonGeneric>);
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('debería ejecutar onClick cuando se hace click', () => {
    const handleClick = vi.fn();
    render(<ButtonGeneric onClick={handleClick}>Click</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('debería estar deshabilitado cuando disabled es true', () => {
    render(<ButtonGeneric disabled>Disabled</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('debería mostrar spinner cuando loading es true', () => {
    render(<ButtonGeneric loading>Loading</ButtonGeneric>);
    
    const button = screen.getByRole('button', { name: /cargando/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    
    // Verificar que el spinner SVG está presente
    const spinner = button.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('no debería mostrar children cuando loading es true', () => {
    render(<ButtonGeneric loading>Click me</ButtonGeneric>);
    
    expect(screen.queryByText('Click me')).not.toBeInTheDocument();
  });

  it('no debería ejecutar onClick cuando está disabled', () => {
    const handleClick = vi.fn();
    render(<ButtonGeneric onClick={handleClick} disabled>Disabled</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('no debería ejecutar onClick cuando está loading', () => {
    const handleClick = vi.fn();
    render(<ButtonGeneric onClick={handleClick} loading>Loading</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('debería aplicar variant default por defecto', () => {
    render(<ButtonGeneric>Default</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-purple');
  });

  it('debería aplicar variant cancel', () => {
    render(<ButtonGeneric variant="cancel">Cancel</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('border-purple');
  });

  it('debería aplicar variant secondary', () => {
    render(<ButtonGeneric variant="secondary">Secondary</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('border-gray-300');
  });

  it('debería usar type button por defecto', () => {
    render(<ButtonGeneric>Button</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.type).toBe('button');
  });

  it('debería aceptar type submit', () => {
    render(<ButtonGeneric type="submit">Submit</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.type).toBe('submit');
  });

  it('debería aplicar className personalizado', () => {
    render(<ButtonGeneric className="custom-class">Custom</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('debería aplicar estilos de disabled cuando loading', () => {
    render(<ButtonGeneric loading>Loading</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('cursor-not-allowed');
  });

  it('debería aplicar estilos de disabled cuando disabled', () => {
    render(<ButtonGeneric disabled>Disabled</ButtonGeneric>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('cursor-not-allowed');
  });
});
