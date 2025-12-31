import React, { useState, useEffect } from 'react';
import { Flag  } from 'lucide-react';
import { eventMetricsService } from "../../services/Dashboard/eventMetricsService";

const HorizontalBarChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const events = (await eventMetricsService.getTopEvents(5)) || [];
        console.log("Top events:", events);

        const maxQty =
          events.length > 0
            ? Math.max(...events.map((e) => e.totalQuantity || 0))
            : 1;

        const data = events.map((e) => ({
          label: e.eventTitle,                 
          realValue: e.totalQuantity || 0,    
          totalAmount: e.totalAmount || 0,      
          value: Math.round(
            ((e.totalQuantity || 0) / maxQty) * 100
          ),
          color: "#cb00e3",
        }));

        setChartData(data);
      } catch (err) {
        console.error("Error cargando top eventos:", err);
        setError("No se pudo cargar el ranking de eventos");
      } finally {
        setLoading(false);
      }
    };

    fetchTopEvents();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-xl bg-purple flex items-center justify-center">
          <Flag  className="w-4 text-white"/>            
        </div>
        <h3 className="text-sm font-bold text-black">Top eventos más vendidos</h3>
      </div>

      {!loading && !error && chartData.length > 0 && (
        <div className="flex justify-center mb-2">
          <h4 className="text-xs text-gray-700 text-center">
            Entradas vendidas
          </h4>
        </div>
      )}

      {loading && (
        <p className="text-xs text-gray-700 px-1">
          Cargando ranking de eventos...
        </p>
      )}

      {error && !loading && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}

      {!loading && !error && chartData.length === 0 && (
        <p className="text-xs text-gray-700 px-1">
          No hay datos de eventos disponibles.
        </p>
      )}
      
      {!loading && !error && chartData.length > 0 && (
        <>
          {/* Barras horizontales */}
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-xs text-black">{item.label}</div>
                {/* Contenedor barra */}
                <div className="flex-1 h-7 bg-gray-100 rounded-xl overflow-hidden shadow-md">
                  <div 
                    className="h-full flex items-center justify-end rounded-md transition-all duration-300 ease-in-out drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]" 
                    style={{ 
                      width: `${item.value}%`,
                      backgroundColor: item.color
                    }}
                  >
                    <span className="pr-3 text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                      {item.realValue}
                    </span>
                  </div>
                </div>

                {/* monto */}
                <div className="pl-2 text-[11px] text-gray-700">
                  S/ {item.totalAmount.toFixed(2)}
                </div>    
              </div>
            ))}
          </div>
        </>  
      )}  
    </div>
  );
};

export default HorizontalBarChart;