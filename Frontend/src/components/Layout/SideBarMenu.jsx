import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, User, Map, UserStar, LogOut, Settings, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import logo from "../../assets/images/logo_blanco.png";

const SideBarMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, logout } = useAuth();

  const menuItems = [
    { name: "Home", icon: <Home size={26} />, path: "/homeAdmin"},
    { name: "Eventos", icon: <Clock size={26} />, path: "/eventos", role: "ADMIN" },
    { name: "Usuarios", icon: <User size={26} />, path: "/usuarios", role: "ADMIN" },
    { name: "Locales", icon: <Map size={26} />, path: "/locales", role: "ADMIN" },
    { name: "Admins", icon: <UserStar size={26} />, path: "/administradores", role: "ADMIN" },
    { name: "Settings", icon: <Settings size={26} />, path: "/settings", role: "ADMIN" },
  ];

  const [active, setActive] = useState("");
  const [isOpen, setIsOpen] = useState(false); // menú hamburguesa

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
    );
    setActive(currentItem ? currentItem.name : "");
  }, [location.pathname]);

  const handleNavigation = (item) => {
    setActive(item.name);
    navigate(item.path);
    setIsOpen(false); // cerrar drawer en móvil
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    setIsOpen(false);
  };

  const renderMenuButtons = () =>
    menuItems
      .filter((item) => !item.role || hasRole(item.role))
      .map((item) => (
        <button
          key={item.name}
          onClick={() => handleNavigation(item)}
          className={`flex flex-col items-center font-medium transition-all duration-200 ${
            active === item.name
              ? "text-white bg-purple rounded-xl p-3 shadow-lg"
              : "text-gray hover:text-purple"
          }`}
        >
          {item.icon}
          <span className="mt-1 text-[10px] font-semibold leading-tight">
            {item.name}
          </span>
        </button>
  ));

  return (
    <>
    {/* TOP BAR SOLO MÓVIL */}
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white shadow-md px-4 h-14">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md hover:bg-gray-100"
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>
      <span className="text-xl font-bold text-black">
        Digiticket
      </span>
      <div className="w-10" /> {/* para balancear el espacio del icono */}
    </div>

    {/* DRAWER MÓVIL */}
    <div
      className={`md:hidden fixed inset-0 z-40 transition pointer-events-none ${
        isOpen ? "pointer-events-auto" : ""
      }`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Contenedor lateral */}
      <div
        className={`relative h-full w-40 bg-white shadow-xl flex flex-col transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <img src={logo} alt="Logo" className="h-10" />
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>

        {/* Opciones de menú */}
        <div className="flex-1 flex flex-col items-center gap-6 py-6">
          {renderMenuButtons()}
        </div>

        {/* Cerrar sesión */}
        <div className="mt-auto flex items-center justify-center py-6 border-t">
          <button
            onClick={handleLogout}
            className="flex flex-col items-center text-gray hover:text-red-500 text-xs"
            title="Cerrar sesión"
          >
            <LogOut size={26} />
            <div className="mt-1 text-[10px] font-semibold flex flex-col items-center">
              <span>
                Cerrar <br />
                sesión
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    {/* SIDEBAR DESKTOP */}
    <div className="hidden md:flex min-h-screen w-24 flex-col bg-white shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-center py-6">
        <img src={logo} alt="Logo" className="w-12 h-12" />
      </div>

      {/* Opciones de menú */}
      <div className="flex flex-col items-center gap-6 py-6">
        {renderMenuButtons()}
      </div>

      {/* Cerrar sesión */}
      <div className="mt-auto flex items-center justify-center py-6">
        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-gray hover:text-red-500 text-xs"
          title="Cerrar sesión"
        >
          <LogOut size={26} />
          <div className="mt-1 text-[10px] font-semibold flex flex-col items-center">
            <span>
              Cerrar <br />
              sesión
            </span>
          </div>
        </button>
      </div>
    </div>
    </>
  );
};

export default SideBarMenu;