import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Ticket,
  User,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import logo from "../../assets/images/logo_blanco.png";
import IconUsuario from "../../assets/images/user-icon.png";
import { useAuth } from "../../context/AuthProvider";
import { useCart } from "../../context/CartContext";
import SearchBarClient from "./SearchBarClient";

const TopBarUser = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogout = () => logout();

  const handleGoHome = () => {
    navigate("/homeClient");
    setIsMenuOpen(false);
  };

  const handleGoTickets = () => {
    navigate("/ticketClient");
    setIsMenuOpen(false);
  };

  const handleGoProfile = () => {
    navigate("/profileClient");
    setIsMenuOpen(false);
  };

  const handleGoCart = () => {
    navigate("/cartClient");
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

      {/* Búsqueda */}
      <div className="flex-grow flex justify-center">
        <SearchBarClient />
      </div>

      {/* Carrito */}
      <button
        onClick={handleGoCart}
        className="relative p-3 rounded-full hover:bg-gray-100 transition flex-shrink-0"
        aria-label="Ir al carrito"
      >
        <ShoppingCart size={24} className="text-gray-700" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-fuchsia-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </button>

      {/* Usuario */}
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
              <p className="text-sm text-gray-600 leading-tight">Bienvenido,</p>
              <p className="text-base font-bold text-gray-900">
                {user?.name || "Nombre usuario"}
              </p>
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
              onClick={handleGoTickets}
              className="flex items-center gap-3 px-4 py-2 w-full text-gray-700 hover:bg-gray-100 transition text-sm"
            >
              <Ticket size={18} className="text-fuchsia-600" />
              Mis entradas
            </button>

            <button
              onClick={handleGoProfile}
              className="flex items-center gap-3 px-4 py-2 w-full text-gray-700 hover:bg-gray-100 transition text-sm"
            >
              <User size={18} className="text-fuchsia-600" />
              Mi perfil
            </button>

            <div className="border-t border-gray-200 my-1"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-gray-100 transition text-sm"
            >
              <LogOut size={18} className="text-red-500" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBarUser;
