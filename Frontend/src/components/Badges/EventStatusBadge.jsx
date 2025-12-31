import React from "react";

const statusStyles = {
  DRAFT: "bg-gray-400 text-white",
  PUBLISHED: "bg-green-500 text-white",
  CANCELED: "bg-red-500 text-white",
  FINISHED: "bg-purple text-white",
  INACTIVE: "bg-red-500 text-white",
  ACTIVE: "bg-green-500 text-white",
};

/* Traduccion de estado */
const statusLabels = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  CANCELED: "Cancelado",
  FINISHED: "Finalizado",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

const StatusBadge = ({ status }) => {
  const classes = statusStyles[status] || "bg-gray-100 text-gray-600";
  const label = statusLabels[status] || status;

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${classes}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;