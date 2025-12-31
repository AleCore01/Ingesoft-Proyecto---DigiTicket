import React, { useState, useMemo, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ChartLine } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { metricsService } from "../../services/Dashboard/metricsService";

import TimeFilter from '../../components/Badges/TimeFilter'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const SalesTrendChart = ({ selectedTime = "Mensual", onTimeChange }) => {
  const [series, setSeries] = useState({
    labels: [],
    ingresos: [],
    tickets: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mapTimeToPeriod = (time) => {
    if (time === "Semanal") return "WEEK";
    if (time === "Anual") return "YEAR";
    return "MONTH"; // Mensual por defecto
  };

  const adaptToSeries = (payload) => {
    const formatLabel = (label) => {
      if (!label.includes("-")) return label;

      const [year, month] = label.split("-");
      const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
      ];

      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]}`;
    };

    const labels = payload.map(item => formatLabel(item.label));
    const ingresos = payload.map(item => item.revenue);
    const tickets = payload.map(item => item.ticketsSold);

    return { labels, ingresos, tickets };
  };

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const period = mapTimeToPeriod(selectedTime);

        const res = await metricsService.getRevenueAndTickets({ period });

        const payload = res.data ?? res;

        const adapted = adaptToSeries(payload);
        setSeries(adapted);
      } catch (err) {
        console.error("Error cargando métricas para el grafico de barras", err);
        setError("No se pudieron cargar las métrricas para el grafico de barras");
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [selectedTime]);

  const data = {
    labels: series.labels,
    datasets: [
      {
        label: 'Ingresos Totales',
        data: series.ingresos,
        customTickets: series.tickets,
        borderColor: '#cb00e3', 
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return null; 
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top
          );
          gradient.addColorStop(0, "rgba(203, 0, 227, 0)");   
          gradient.addColorStop(1, "rgba(203, 0, 227, 0.25)"); 
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.2, 
        pointBackgroundColor: '#cb00e3',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: "#020617", 
        borderColor: "#ffffff",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,         
        borderRadius: 12,
        displayColors: false,      
        titleColor: "#ffffff",    
        titleFont: {
          family: "Poppins",
          size: 11,
          weight: "600",
        },
        bodyColor: "#f9fafb",
        bodyFont: {
          family: "Poppins",
          size: 12,
          weight: "400",
        },
        callbacks: {
          title: (items) => {
          if (!items.length) return "";
            return items[0].label;
          },

          label: (context) => {
            const idx = context.dataIndex;
            const ingreso = context.parsed.y;
            const tickets = context.dataset.customTickets?.[idx] ?? null;

            const lines = [];
            if (tickets != null) {
              lines.push(`${tickets.toLocaleString()} tickets vendidos`);
            }
            lines.push(`S/. ${ingreso.toLocaleString()} ingresos`);
            return lines; 
          },
        }
      },
      datalabels: { display: false }
    },
    elements: {
      line: {
        borderJoinStyle: "miter", 
        borderCapStyle: "butt",  
      },
      point: {
        borderWidth: 0,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxTicksLimit: 8, 
          color: '#374151', 
          font: { family: 'Poppins', },
          callback: (value, index, ticks) => {
            // máximo del eje Y
            const max = ticks[ticks.length - 1]?.value ?? value;

            // Caso 1: todos los valores son menores a 1000 -> sin "k"
            if (max < 1000) {
              return `S/. ${value}`;
            }

            // Caso 2: eje con valores grandes: Para valores menores a 1000, mostramos el número normal (0, 500)
            if (Math.abs(value) < 1000) {
              return `S/. ${value}`;
            }

            // Para 1000 o más, usamos notación "k"
            const inThousands = value / 1000;

            // Si es múltiplo exacto de 1000 -> sin decimales (1k, 2k, 3k)
            if (Number.isInteger(inThousands)) {
              return `S/. ${inThousands}k`;
            }

            return `S/. ${inThousands.toFixed(1)}k`; // permitir 1.5k, 2.5k
          },
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          padding: 8,  
          color: '#374151', 
          font: { family: 'Poppins', },
        },
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // --- calcular totales 
  const totalIngresos = useMemo(
    () => series.ingresos.reduce((acc, v) => acc + v, 0),
    [series.ingresos]
  );

  const totalTickets = useMemo(
    () => series.tickets.reduce((acc, v) => acc + v, 0),
    [series.tickets]
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      {/* HEADER: Título + Filtros */}
      <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-purple flex items-center justify-center">
            <ChartLine className="w-4 text-white"/>       
          </div>
          <h3 className="text-sm font-bold text-black">Control de Ingresos totales</h3>
        </div>

        {/* Filtros */}
        <div className="flex w-full sm:w-auto justify-center sm:justify-end">
          <TimeFilter
            selectedTime={selectedTime}
            onChange={(time) => {
              if (onTimeChange) {
                onTimeChange(time);
              }
            }}
            defaultTime="Mensual"
            timeOptions={["Semanal", "Mensual", "Anual"]} 
          />
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-700">Cargando gráfico...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="mb-3 flex flex-col sm:flex-row items-center justify-center gap-8 text-black">
            {/* Total ingresos */}
            <div className="text-center">
              <p className="text-2xl font-bold">S/ {totalIngresos.toLocaleString()}</p>
              <p className="text-xs py-1">Total de ingresos</p>
            </div>

            {/* Total entradas */}
            <div className="text-center">
              <p className="text-2xl font-bold">{totalTickets.toLocaleString()}</p>
              <p className="text-xs py-1">Total de entradas vendidas</p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="h-64">
            <Line key={selectedTime} data={data} options={options} />
          </div>
        </>
      )}
    </div>
  );
};

export default SalesTrendChart;