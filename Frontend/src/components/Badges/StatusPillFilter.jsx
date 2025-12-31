import { useState, useEffect } from "react";

function StatusPillFilter({
    statusOptions = [],
    selectedStatus,              // valor externo opcional (controlado por el padre)
    onChange,
    defaultStatus = "",           // si no se pasa, será "" (equivale a "Todos")
    includeAll = true 
  }) {
  const [internalStatus, setInternalStatus] = useState(defaultStatus);

  // Si defaultStatus cambia (una vez), lo aplicamos
  useEffect(() => {
    const normalized = defaultStatus.toLowerCase();
    setInternalStatus(normalized);
    if (selectedStatus === undefined && onChange) {
      onChange(normalized);
    }
  }, [defaultStatus, selectedStatus]);

  const handleClick = (status) => {
    const isAll = status === "Todos";
    const newStatus = isAll ? "" : status.toLowerCase();
    setInternalStatus(newStatus);
    if (onChange) onChange(newStatus);
  };

  // Usa el estado externo si lo pasan, si no, usa el interno
  const currentStatus = (selectedStatus ?? internalStatus)?.toLowerCase();
  const options = includeAll ? ["Todos", ...statusOptions] : statusOptions;

  return (
    <div className="flex w-full items-center px-3 py-2 bg-gray-100 rounded-full shadow-sm">
      <span className="px-2 text-sm font-semibold text-black whitespace-nowrap">Estados:</span>
        <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
          {options.map((status) => {
            const value = status === "Todos" ? "" : status.toLowerCase();
            const isSelected = currentStatus === value;
              
              return (
              <button
                  key={status}
                  onClick={() => handleClick(status)}
                  className={`px-4 py-1 rounded-full shadow-sm text-sm transition
                  ${isSelected
                      ? "bg-purple text-white font-semibold"
                      : "bg-white text-black border-white hover:bg-gray-100"}
                  `}
              >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
              );
          })}
        </div>
    </div>    
  );
}

export default StatusPillFilter;