import React from 'react';
import { Grid3x3, List, Columns3, LayoutGrid } from 'lucide-react';

/**
 * Selector de modo de vista para los tickets (estilo macOS Finder)
 * - grid: Vista de cuadrícula (2 columnas)
 * - list: Vista de lista (1 columna con detalles)
 * - columns: Vista de columnas (3 columnas compactas)
 * - gallery: Vista de galería (tarjetas grandes con imágenes destacadas)
 */
const ViewModeSelector = ({ viewMode, setViewMode }) => {
  const views = [
    { id: 'grid', icon: Grid3x3, label: 'Cuadrícula' },
    { id: 'list', icon: List, label: 'Lista' },
    { id: 'columns', icon: Columns3, label: 'Columnas' },
    { id: 'gallery', icon: LayoutGrid, label: 'Galería' }
  ];

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
      {views.map(view => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            onClick={() => setViewMode(view.id)}
            className={`p-2 rounded transition-colors ${
              viewMode === view.id
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title={view.label}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
};

export default ViewModeSelector;
