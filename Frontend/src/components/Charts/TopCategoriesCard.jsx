import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ChartPie } from 'lucide-react';
import { Doughnut } from "react-chartjs-2";
import { categoryMetricsService } from "../../services/Dashboard/categoryMetricsService";

const externalLabelsPlugin = {
  id: "externalLabels",
  afterDatasetsDraw(chart) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 720; // Detectar si es móvil
    if (isMobile) return; // No dibujar etiquetas externas en móvi

    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];

    const labels = chart.data.labels || [];
    const quantities = dataset.ticketCounts || [];
    const amounts = dataset.totalAmounts || [];

    ctx.save();
    ctx.font = '11px "Poppins"';
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";

    meta.data.forEach((arc, index) => {
      const props = arc.getProps(
        ["x", "y", "startAngle", "endAngle", "outerRadius"],
        true
      );

      const angle = (props.startAngle + props.endAngle) / 2;
      const radius = props.outerRadius;

      // Puntos de la línea
      const lineStartX = props.x + Math.cos(angle) * (radius + 4);
      const lineStartY = props.y + Math.sin(angle) * (radius + 4);
      const lineMidX = props.x + Math.cos(angle) * (radius + 14);
      const lineMidY = props.y + Math.sin(angle) * (radius + 14);

      const isRightSide = Math.cos(angle) >= 0;
      const lineEndX = lineMidX + (isRightSide ? 18 : -18);
      const lineEndY = lineMidY;

      // Dibujar línea (radial + horizontal)
      ctx.strokeStyle = "#000000"; 
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineMidX, lineMidY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      // Texto: "Categoría X - 100 entradas"
      const label = labels[index] || "";
      const qty = quantities[index];
      const amount = amounts[index];

      // Texto: "120 entradas - S/ 680.50"
      let detailText = "";
      if (qty != null) {
        detailText += `${qty} entradas`;
      }
      if (amount != null) {
        detailText += ` - S/ ${amount.toFixed(2)}`;
      }

      ctx.textAlign = isRightSide ? "left" : "right";
      const textX = lineEndX + (isRightSide ? 4 : -4);
      const textY = lineEndY;

      ctx.fillStyle = "#000000";
      ctx.font = 'bold 12px "Poppins"';
      ctx.fillText(label, textX, textY - 7);

      ctx.font = '12px "Poppins"';
      ctx.fillText(detailText, textX, textY + 10);
    });

    ctx.restore();
  },
};

/* Registrar plugins */
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels, externalLabelsPlugin);

const TopCategoriesCard = ({ limit = 4 }) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 720 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 720);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        ticketCounts: [],
        totalAmounts: [],
        backgroundColor: ["#cb00e3", "#df57f2", "#ef9dfb", "#f5d0fe"],
        borderWidth: 0,
      },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 20, // <-- Aumenta espacio para textos externos
    },
    cutout: "40%",          // grosor del doughnut
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,    
      },
      datalabels: {
        color: "#ffffff",
        font: {
          size: 14,
          weight: "bold",
        },
        textStrokeColor: "black",
        formatter: (value) => value,
      },
    },
  };

  useEffect(() => {
    const fetchTopCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const categories = (await categoryMetricsService.getTopCategories(limit)) || [];
        console.log("Top categories:", categories);

        const labels = categories.map((c) => c.categoryName);
        const quantities = categories.map((c) => c.totalQuantity);
        const amounts = categories.map((c) => c.totalAmount);

        // El tamaño de cada porción será la cantidad de entradas
        const data = quantities;

        setChartData((prev) => ({
          ...prev,
          labels,
          datasets: [
            {
              ...prev.datasets[0],
              data,
              ticketCounts: quantities,
              totalAmounts: amounts,
            },
          ],
        }));
      } catch (err) {
        console.error("Error cargando top categories:", err);
        setError("No se pudo cargar las categorías");
      } finally {
        setLoading(false);
      }
    };

    fetchTopCategories();
  }, [limit]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-xl bg-purple flex items-center justify-center">
            <ChartPie className="w-4 text-white"/>            
        </div>
        <h3 className="text-sm font-bold text-black">Categorías más vendidas</h3>
      </div>

      {loading && (
        <p className="text-xs text-gray-700 px-1">Cargando categorías...</p>
      )}

      {error && !loading && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}

      {!loading && !error && chartData.labels.length === 0 && (
        <p className="text-xs text-gray-700 px-1">
          No hay datos de categorías disponibles.
        </p>
      )}

      {!loading && !error && chartData.labels.length > 0 && (
        <>
          {/* Gráfico */}
          <div className="w-full h-60 flex items-center justify-center">
            <Doughnut data={chartData} options={chartOptions} />
          </div>

          {/* Leyenda debajo (solo móvil) */}
          {isMobile && (
            <div className="mt-4 space-y-3 px-1">
              {chartData.labels.map((label, i) => (
                <div key={i} className="text-xs text-black flex items-start gap-2"> 
                  {/* Color asociado */}
                  <span
                    className="w-3 h-3 rounded-full mt-1"
                    style={{
                      backgroundColor: chartData.datasets[0].backgroundColor[i],
                    }}
                  ></span>

                  <div>
                    <strong>{label}</strong><br />
                    {chartData.datasets[0].ticketCounts[i]} entradas – 
                    S/ {chartData.datasets[0].totalAmounts[i].toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopCategoriesCard;