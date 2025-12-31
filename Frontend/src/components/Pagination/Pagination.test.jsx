import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from './Pagination.jsx';

describe('Pagination', () => {
  it('deshabilita el botón Anterior en la primera página', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onChange} />);
    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    expect(prevBtn).toBeDisabled();
  });

  it('deshabilita el botón Siguiente en la última página', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={5} onPageChange={onChange} />);
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeDisabled();
  });

  it('llama onPageChange con página anterior válida', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('llama onPageChange con página siguiente válida', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('no llama onPageChange si currentPage es 1 y se hace click en Anterior', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('no llama onPageChange si currentPage es totalPages y se hace click en Siguiente', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('muestra el texto correcto de estado de página', () => {
    render(<Pagination currentPage={2} totalPages={7} onPageChange={() => {}} />);
    expect(screen.getByText(/Página 2 de 7/i)).toBeInTheDocument();
  });

  it('no permite cambio fuera de límites (página 0)', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onChange} />);
    // Simular directamente la función interna disparando un decremento adicional
    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    // disabled evita el click, ya cubierto arriba; este test reafirma no llamada
    fireEvent.click(prevBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('no permite cambio fuera de límites (página > totalPages)', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={5} onPageChange={onChange} />);
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextBtn);
    expect(onChange).not.toHaveBeenCalled();
  });
});
