import React, { useEffect, useState } from "react";
import { BadgeDollarSign , Tickets, ArrowBigDownDash, ChartNoAxesCombined, Percent } from 'lucide-react'
import { dashboardService } from "../services/Dashboard/dashboardService";
import { reportService } from "../services/Dashboard/reportService";

import SideBarMenu from "../components/Layout/SideBarMenu";
import TopBar from "../components/Layout/TopBar";
import StatBox from "../components/Cards/StatBox";
import ButtonGeneric from "../components/Buttons/ButtonGeneric";
import ContentPreLoader from "../components/Layout/ContentPreloader";
import SalesTrendChart from "../components/Charts/SalesTrendChart";
import HorizontalBarChart from "../components/Charts/HorizontalBarChart";
import TopCategoriesCard from "../components/Charts/TopCategoriesCard";

const HomePageAdmin = () => {
  const [metrics, setMetrics] = useState({
    sales: null,
    tickets: null,
    visits: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTime, setSelectedTime] = useState("Mensual"); // por defecto
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const mapTimeToReportPeriod = (time) => {
    if (time === "Semanal") return "WEEK";
    if (time === "Mensual") return "MONTH";
    if (time === "Anual") return "YEAR"; 
    return "DAY";
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [salesData, ticketsData, visitsData] = await Promise.all([
          dashboardService.getTodaySales(),
          dashboardService.getTodayTickets(),
          dashboardService.getTodayVisits(),
        ]);

        setMetrics({
          sales: salesData,     // { totalSales, variationVsYesterday }
          tickets: ticketsData, // { ticketsToday, differenceVsYesterday }
          visits: visitsData,   // { visitsToday, variationVsYesterday }
        });
      } catch (err) {
        console.error("Error dashboard", err);
        setError("Error al cargar el dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /* --- helper --- */
  const handleDownloadPdf = async () => {
    if (downloadingPdf) return;
    
    setDownloadingPdf(true);
    try {
      const period = mapTimeToReportPeriod(selectedTime);
      const fileData = await reportService.downloadPdf(period); // Blob

      const blob = new Blob([fileData], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dashboard-report-${period}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar en PDF:", error);
      alert("Ocurrió un error al descargar el reporte en PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (downloadingCsv) return;
    
    setDownloadingCsv(true);
    try {
      const period = mapTimeToReportPeriod(selectedTime);
      const fileData = await reportService.downloadCsv(period); // Blob

      const blob = new Blob([fileData], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dashboard-report-${period}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar en CSV:", error);
      alert("Ocurrió un error al descargar el reporte en CSV.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <SideBarMenu />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-8 bg-backgroundGeneral flex items-center justify-center">
            <ContentPreLoader loading={loading} text="Cargando dashboard..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="p-4 text-sm text-red-600">{error}</p>;
  }

  const { sales, tickets, visits } = metrics;

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden pt-16 md:pt-0">
        <div className="hidden md:block">
          <TopBar />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-3">
              Dashboard
            </h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <ButtonGeneric
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto"
                variant="default"
                disabled={downloadingPdf || downloadingCsv}
              >
                <ArrowBigDownDash className="w-5 h-5" />
                {downloadingPdf ? "Descargando..." : "Descargar PDF"}
              </ButtonGeneric>

              <ButtonGeneric
                onClick={handleDownloadCsv}
                className="w-full sm:w-auto"
                variant="default"
                disabled={downloadingPdf || downloadingCsv}
              >
                <ArrowBigDownDash className="w-5 h-5" />
                {downloadingCsv ? "Descargando..." : "Descargar CSV"}
              </ButtonGeneric>
            </div>
          </div>

          {/* Metricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox
              title="Venta total del día"
              value={
                sales
                  ? `S/ ${sales.totalSales.toFixed(2)}`
                  : "S/ 0.00"
              }
              increase={
                sales
                  ? `${sales.variationVsYesterday.toFixed(2)}%`
                  : null
              }
              icon={<BadgeDollarSign className="w-5 text-black"/>}
            />

            <StatBox
              title="Numero de entradas vendidas"
              value={tickets ? tickets.ticketsToday : 0}
              increase={
                tickets
                  ? (() => {
                      const today = tickets.ticketsToday;
                      const diff = tickets.differenceVsYesterday;
                      const yesterday = today - diff;

                      let percent = 0;

                      if (yesterday === 0) {
                        percent = today > 0 ? 100 : 0; // evitar división por cero
                      } else {
                        percent = (diff / yesterday) * 100;
                      }

                      const formatted = percent.toFixed(2);

                      return `${formatted}%`;
                    })()
                  : null
              }
              icon={<Tickets className="w-5 text-black"/>}
              description={
                tickets && tickets.ticketsToday > 0
                  ? `${tickets.differenceVsYesterday} entradas vs. día anterior`
                  : "Sin número de entradas"
              }
            />

            <StatBox
              title="Porcentaje de visitas"
              value={visits ? visits.visitsToday : 0}
              increase={
                visits
                  ? `${visits.variationVsYesterday.toFixed(2)}%`
                  : null
              }
              icon={<Percent className="w-4 text-black"/>}
              description={
                visits
                  ? `${Math.round(visits.visitsToday - (visits.visitsToday / (1 + visits.variationVsYesterday / 100)))} visitas vs. día anterior`
                  : "Sin visitas"
              }
            />
          </div>

          {/* Graficos */}
          <div className="flex flex-col gap-4 mt-4">
            <SalesTrendChart 
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
            />      
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopCategoriesCard />
              <HorizontalBarChart />
            </div>
          </div>       
        </div>
      </div>
    </div>
  );
};

export default HomePageAdmin;