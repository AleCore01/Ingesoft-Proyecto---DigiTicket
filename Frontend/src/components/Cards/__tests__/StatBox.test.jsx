import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatBox from '../StatBox';
import { TrendingUp } from 'lucide-react';

describe('StatBox', () => {
  it('debería renderizar title y value', () => {
    render(<StatBox title="Total Ventas" value="1,234" />);
    
    expect(screen.getByText('Total Ventas')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('debería renderizar icono cuando se proporciona', () => {
    const { container } = render(
      <StatBox 
        title="Usuarios" 
        value="500" 
        icon={<TrendingUp data-testid="trend-icon" />} 
      />
    );
    
    expect(screen.getByTestId('trend-icon')).toBeInTheDocument();
  });

  it('debería renderizar description cuando se proporciona', () => {
    render(
      <StatBox 
        title="Ingresos" 
        value="S/ 5,000" 
        description="vs mes anterior" 
      />
    );
    
    expect(screen.getByText('vs mes anterior')).toBeInTheDocument();
  });

  it('debería mostrar incremento positivo con estilo verde', () => {
    render(
      <StatBox 
        title="Ventas" 
        value="100" 
        increase="+15%" 
      />
    );
    
    const increaseElement = screen.getByText(/15%/);
    expect(increaseElement).toBeInTheDocument();
    expect(increaseElement.className).toContain('bg-emerald-100');
    expect(increaseElement.className).toContain('text-emerald-700');
    expect(increaseElement.textContent).toContain('▲');
  });

  it('debería mostrar incremento negativo con estilo rojo', () => {
    render(
      <StatBox 
        title="Pérdidas" 
        value="50" 
        increase="-10%" 
      />
    );
    
    const increaseElement = screen.getByText(/10%/);
    expect(increaseElement).toBeInTheDocument();
    expect(increaseElement.className).toContain('bg-red-100');
    expect(increaseElement.className).toContain('text-red-700');
    expect(increaseElement.textContent).toContain('▼');
  });

  it('no debería mostrar badge de incremento si no se proporciona', () => {
    const { container } = render(
      <StatBox title="Ventas" value="100" />
    );
    
    const badge = container.querySelector('.rounded-full');
    expect(badge).not.toBeInTheDocument();
  });

  it('debería renderizar sin description', () => {
    render(<StatBox title="Eventos" value="25" />);
    
    expect(screen.queryByText('vs mes anterior')).not.toBeInTheDocument();
  });

  it('debería aplicar estilos de tarjeta correctamente', () => {
    const { container } = render(
      <StatBox title="Test" value="123" />
    );
    
    const card = container.firstChild;
    expect(card.className).toContain('rounded-2xl');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('shadow-md');
  });

  it('debería renderizar todos los elementos juntos', () => {
    render(
      <StatBox 
        title="Eventos Activos" 
        value="42" 
        increase="+12%" 
        icon={<TrendingUp data-testid="icon" />}
        description="este mes"
      />
    );
    
    expect(screen.getByText('Eventos Activos')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/12%/)).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('este mes')).toBeInTheDocument();
  });

  it('debería manejar valores grandes correctamente', () => {
    render(<StatBox title="Total" value="1,234,567" />);
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('debería manejar incremento de 0%', () => {
    render(<StatBox title="Sin cambio" value="100" increase="0%" />);
    
    const increaseElement = screen.getByText(/0%/);
    expect(increaseElement).toBeInTheDocument();
    // 0% no comienza con -, por lo tanto es considerado positivo
    expect(increaseElement.className).toContain('bg-emerald-100');
  });
});
