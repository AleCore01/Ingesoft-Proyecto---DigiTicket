import React from "react";
import { Calendar } from "lucide-react";

const monthsEs = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const formatDateEs = (d) => {
  const day = String(d.getDate()).padStart(2, "0");
  const month = monthsEs[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month}, ${year}`; // 15 de Diciembre, 2025
};

const DateBadge = ({ className = "", iconSize = 12, showIcon = true }) => {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`flex items-center gap-1 px-4 py-2 bg-white rounded-full shadow-sm text-[12px] font-semibold text-black ${className}`}>
      {showIcon && 
        <Calendar 
            size={iconSize}
            strokeWidth={2.5} 
            className="text-black" 
            aria-hidden="true" />}
      <time dateTime={now.toISOString()} className="text-[11px] sm:text-xs px-1">
        {formatDateEs(now)}
      </time>
    </div>
  );
};

export default DateBadge;