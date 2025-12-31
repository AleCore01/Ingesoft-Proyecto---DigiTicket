import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, LogIn } from "lucide-react";
import logo from "../../assets/images/logo_blanco.png";
import IconUsuario from "../../assets/images/user-icon.png";
import SearchBarPublic from "./SearchBarPublic"; // <-- IMPORTANTE

const TopBarPublic = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleGoHome = () => {
    navigate("/landingPage");
    setIsMenuOpen(false);
  };

  const handleGoLogin = () => {
    navigate("/login");
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50 px-8 py-4 flex justify-between items-center gap-8">

      {/* Logo */}
      <div
        className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition flex-shrink-0"
        onClick={handleGoHome}
      >
        <img src={logo} alt="DigiTicket logo" className="w-14 h-14 object-contain" />
        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
          DigiTicket
        </span>
      </div>

      {/* Búsqueda (centrada) */}
      <div className="flex-grow flex justify-center">
        <SearchBarPublic />
      </div>

      {/* Usuario público */}
      <div className="relative flex-shrink-0">
        <button
          onClick={toggleMenu}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-5 py-2 shadow-sm hover:shadow-md transition min-w-[230px] justify-between"
        >
          <div className="flex items-center gap-3">
            <img
              src={IconUsuario}
              alt="Icono usuario"
              className="w-8 h-8 rounded-full bg-fuchsia-600 p-1"
            />
            <div className="text-left">
              <p className="text-sm text-gray-600 leading-tight">Bienvenido</p>
              <p className="text-base font-bold text-gray-900">Invitado</p>
            </div>
          </div>

          {isMenuOpen ? (
            <ChevronUp className="text-gray-800" size={18} />
          ) : (
            <ChevronDown className="text-gray-800" size={18} />
          )}
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-3 bg-white shadow-lg rounded-xl w-56 border border-gray-100 py-2 z-50">
            <button
              onClick={handleGoLogin}
              className="flex items-center gap-3 px-4 py-2 w-full text-gray-700 hover:bg-gray-100 transition text-sm"
            >
              <LogIn size={18} className="text-fuchsia-600" />
              Iniciar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBarPublic;
