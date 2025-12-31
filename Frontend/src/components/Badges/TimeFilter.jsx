import { useState, useEffect } from "react";

function TimeFilter({
    timeOptions = ["Semanal", "Mensual", "Anual"],
    selectedTime,              // valor externo opcional
    onChange,
    defaultTime = "Mensual",     // valor por defecto
    includeAll = false       
  }) {
  const [internalTime, setInternalTime] = useState(defaultTime);

  useEffect(() => {
    setInternalTime(defaultTime);
    if (onChange) onChange(defaultTime);
  }, [defaultTime]);

  const handleClick = (time) => {
    setInternalTime(time);
    if (onChange) onChange(time);
  };

  const currentTime = (selectedTime ?? internalTime);

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full shadow-sm">
        <div className="flex items-center gap-2 sm:flex-nowrap flex-wrap">
        {timeOptions.map((time) => {
          const isSelected = currentTime === time;
            
            return (
            <button
                key={time}
                 onClick={() => handleClick(time)}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-150
                            active:scale-95 whitespace-nowrap
                ${isSelected
                    ? "bg-purple text-white font-semibold"
                    : " text-black "}
                `}
            >
                {time}
            </button>
            );
        })}
        </div>
    </div>    
  );
}

export default TimeFilter;