import React from "react";

const StatBox = ({ title, value, increase, icon, description }) => {
    const getIncreaseStyles = (inc) => {
        if (!inc) return {};
        
        const isPositive = !inc.startsWith('-');

        return {
        bgColor: isPositive ? "bg-emerald-100" : "bg-red-100",
        textColor: isPositive ? "text-emerald-700" : "text-red-700",
        symbol: isPositive ? "▲" : "▼"
        };
    };

    const increaseStyles = increase ? getIncreaseStyles(increase) : null;
  
    return (
    <div className="w-full max-w-[18rem] rounded-2xl bg-white shadow-md p-4 flex flex-col justify-between">
        
        {/* Primera fila: Título e ícono */}
        <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center">
                {icon}  
            </div>

            {increase && increaseStyles && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${increaseStyles.bgColor} ${increaseStyles.textColor}`}>
                {increaseStyles.symbol} {increase}
              </span>
            )}
        </div>
        
        {/* Segunda fila: Valor principal */}
        <p className="py-1 text-xs font-500 text-black">{title}</p>
        
        {/* Tercera fila: Incremento y descripción */}
        <div className="flex items-baseline gap-3 justify-between">
            <p className="text-2xl font-bold text-black"> {value} </p>
            {description && (
                <p className="text-xs text-gray-700 text-right">
                    {description}
                </p>
            )}
        </div>
    </div>
  );
};

export default StatBox;