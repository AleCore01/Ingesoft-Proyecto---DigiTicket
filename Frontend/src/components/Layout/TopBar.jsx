import React from "react";
import IconUsuario from "../../assets/images/user-icon.png";
import { useAuth } from "../../context/AuthProvider";

const TopBar = () => {
  const { user } = useAuth(); // Obtenemos el usuario desde el contexto

  return (
    <div className="w-full bg-backgroundGeneral top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-end px-14 py-4">
        {/* Lado derecho - Información del usuario */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
            <img
              src={IconUsuario}
              alt="Usuario"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-tight text-right">
            <p className="text-[10px] text-gray">Bienvenid@</p>
            <p className="text-[12px] font-semibold text-black">
              {user?.name || "Nombre usuario"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
