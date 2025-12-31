import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TicketPricesTable from '../TicketPricesTable';

// Mock de los componentes Modal
vi.mock('../Modal/ModalWarning', () => ({
  default: ({ isOpen, onClose, onConfirm }) => 
    isOpen ? (
      <div data-testid="modal-warning">
        <button onClick={onClose}>Cancelar</button>
        <button onClick={onConfirm} disabled={!onConfirm}>Confirmar</button>
      </div>
    ) : null
}));

vi.mock('../Modal/ModalCheck', () => ({
  default: ({ isOpen, message, onClose }) => 
    isOpen ? (
      <div data-testid="modal-check">
        <p>{message}</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null
}));

describe('TicketPricesTable', () => {
  const mockRows = [
    {
      id: '1',
      displayName: 'VIP',
      price: 100,
      capacity: 50,
      availableTickets: 50,
    },
    {
      id: '2',
      displayName: 'General',
      price: 50,
      capacity: 200,
      availableTickets: 180,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar tabla con datos', () => {
    const { container } = render(<TicketPricesTable rows={mockRows} />);
    
    // Verificar que el contenido se renderiza
    expect(container.textContent).toContain('VIP');
    expect(container.textContent).toContain('General');
  });

  it('debería mostrar loading cuando loading es true', () => {
    render(<TicketPricesTable rows={[]} loading={true} />);
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('debería mostrar error cuando error no es null', () => {
    render(<TicketPricesTable rows={[]} error="Error al cargar" />);
    
    expect(screen.getByText(/no se pudo cargar las zonas y precios/i)).toBeInTheDocument();
  });

  it('debería formatear precios en soles', () => {
    render(<TicketPricesTable rows={mockRows} />);
    
    // Verificar que hay texto con formato de moneda
    const priceElements = screen.getAllByText(/s\//i);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('debería mostrar mensaje cuando no hay zonas', () => {
    const { container } = render(<TicketPricesTable rows={[]} />);
    
    expect(container.textContent).toMatch(/no hay zonas|no hay datos/i);
  });

  it('no debería mostrar acciones cuando readOnly es true', () => {
    const { container } = render(
      <TicketPricesTable rows={mockRows} readOnly={true} />
    );
    
    // No debería haber botones de editar/eliminar
    const editButtons = container.querySelectorAll('button[title="Editar"]');
    expect(editButtons.length).toBe(0);
  });

  it('debería mostrar botones de editar y eliminar cuando no es readOnly', () => {
    render(
      <TicketPricesTable 
        rows={mockRows} 
        toggleEditZone={vi.fn()} 
        removeZone={vi.fn()} 
      />
    );
    
    const editButtons = screen.getAllByTitle('Editar');
    const deleteButtons = screen.getAllByTitle('Eliminar');
    
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('debería llamar toggleEditZone al hacer click en editar', () => {
    const toggleEditZone = vi.fn();
    render(
      <TicketPricesTable 
        rows={mockRows} 
        toggleEditZone={toggleEditZone}
        removeZone={vi.fn()}
      />
    );
    
    const editButton = screen.getAllByTitle('Editar')[0];
    fireEvent.click(editButton);
    
    expect(toggleEditZone).toHaveBeenCalledWith(0);
  });

  it('debería abrir modal de confirmación al hacer click en eliminar', () => {
    render(
      <TicketPricesTable 
        rows={mockRows} 
        toggleEditZone={vi.fn()}
        removeZone={vi.fn()}
      />
    );
    
    const deleteButton = screen.getAllByTitle('Eliminar')[0];
    fireEvent.click(deleteButton);
    
    expect(screen.getByTestId('modal-warning')).toBeInTheDocument();
  });

  it('debería cerrar modal de confirmación al cancelar', () => {
    render(
      <TicketPricesTable 
        rows={mockRows} 
        toggleEditZone={vi.fn()}
        removeZone={vi.fn()}
      />
    );
    
    // Abrir modal
    const deleteButton = screen.getAllByTitle('Eliminar')[0];
    fireEvent.click(deleteButton);
    expect(screen.getByTestId('modal-warning')).toBeInTheDocument();
    
    // Cancelar
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByTestId('modal-warning')).not.toBeInTheDocument();
  });

  it('debería llamar removeZone al confirmar eliminación', async () => {
    const removeZone = vi.fn().mockResolvedValue();
    const onMutated = vi.fn();
    
    render(
      <TicketPricesTable 
        rows={mockRows} 
        toggleEditZone={vi.fn()}
        removeZone={removeZone}
        onMutated={onMutated}
      />
    );
    
    // Abrir modal
    const deleteButton = screen.getAllByTitle('Eliminar')[0];
    fireEvent.click(deleteButton);
    
    // Confirmar
    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(removeZone).toHaveBeenCalledWith(0);
    });
  });

  it('debería mostrar modal de éxito después de eliminar', async () => {
    const removeZone = vi.fn().mockResolvedValue();
    
    render(
      <TicketPricesTable 
        rows={mockRows} 
        toggleEditZone={vi.fn()}
        removeZone={removeZone}
      />
    );
    
    // Abrir modal de confirmación
    const deleteButton = screen.getAllByTitle('Eliminar')[0];
    fireEvent.click(deleteButton);
    
    // Confirmar eliminación
    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);
    
    // Esperar modal de éxito
    await waitFor(() => {
      expect(screen.getByTestId('modal-check')).toBeInTheDocument();
      expect(screen.getByText('Se eliminó la zona correctamente')).toBeInTheDocument();
    });
  });

  it('debería manejar diferentes formatos de rows', () => {
    const rowsWithData = { data: mockRows };
    const { container } = render(<TicketPricesTable rows={rowsWithData} />);
    
    expect(container.textContent).toContain('VIP');
  });

  it('debería manejar rows con items', () => {
    const rowsWithItems = { items: mockRows };
    const { container } = render(<TicketPricesTable rows={rowsWithItems} />);
    
    expect(container.textContent).toContain('VIP');
  });

  it('debería deshabilitar botones durante eliminación', async () => {
    const removeZone = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <TicketPricesTable 
        rows={mockRows} 
        toggleEditZone={vi.fn()}
        removeZone={removeZone}
      />
    );
    
    const deleteButton = screen.getAllByTitle('Eliminar')[0];
    fireEvent.click(deleteButton);
    
    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);
    
    // Botones deberían estar deshabilitados durante la eliminación
    await waitFor(() => {
      const editButtons = screen.getAllByTitle('Editar');
      expect(editButtons[0]).toBeDisabled();
    });
  });

  it('debería renderizar acciones personalizadas si se proporciona renderActions', () => {
    const renderActions = () => <button>Acción Personalizada</button>;
    
    render(
      <TicketPricesTable 
        rows={mockRows}
        renderActions={renderActions}
      />
    );
    
    expect(screen.getAllByText('Acción Personalizada')).toHaveLength(2);
  });
});
