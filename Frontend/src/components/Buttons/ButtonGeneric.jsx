"use client";

import React from "react";

const ButtonGeneric = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  variant = "default", // "default" = gris, "active" = morado
}) => {
  const baseStyles =
    "px-10 py-2 w-40 rounded-full text-sm font-bold shadow-sm transition duration-200 flex items-center justify-center gap-2";

  const variants = {
    default:
      "px-6 bg-purple text-white hover:bg-fuchsia-700 hover:text-white transition-all ease-in-out",

    cancel:
    "px-6 bg-white border-2 border-purple text-purple hover:bg-purple hover:text-white transition-all ease-in-out",  

    secondary:
      "px-6 bg-white border border-gray-300 text-gray-800 hover:bg-gray-100",
  };

  const disabledStyles = disabled || loading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${disabledStyles} ${className}`}
      aria-label={loading ? "Cargando..." : undefined}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0
              3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!loading && children}
    </button>
  );
};

export default ButtonGeneric;