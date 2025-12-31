import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Ticket, User, ShoppingCart, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import logo from "../../assets/images/logo_blanco.png";

const SideBarMenuClient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { name: "Home", icon: <Home size={26} />, path: "/homeClient" },
    { name: "Mis entradas", icon: <Ticket size={26} />, path: "/ticketClient" },
    { name: "Mi perfil", icon: <User size={26} />, path: "/profileClient" },
    { name: "Carrito", icon: <ShoppingCart size={26} />, path: "/cartClient" },
  ];

  const [active, setActive] = useState("");

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/")
    );
    setActive(currentItem ? currentItem.name : "");
  }, [location.pathname]);

  const handleNavigation = (item) => {
    setActive(item.name);
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-24 flex flex-col bg-white shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-center py-6">
        <img src={logo} alt="Logo" className="w-12 h-12" />
      </div>

      {/* Opciones */}
      <div className="flex flex-col items-center gap-6 py-6">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavigation(item)}
            className={`flex flex-col items-center font-medium transition-all duration-200 ${
              active === item.name
                ? "text-white bg-fuchsia-600 rounded-xl p-3 shadow-lg"
                : "text-gray-700 hover:text-fuchsia-600"
            }`}
          >
            {item.icon}
            <span className="mt-1 text-[10px] font-semibold leading-tight text-center">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {/* Cerrar sesión */}
      <div className="mt-auto flex items-center justify-center py-6">
        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-gray-500 hover:text-red-500 text-xs"
          title="Cerrar sesión"
        >
          <LogOut size={26} />
          <div className="mt-1 text-[10px] font-semibold flex flex-col items-center">
            <span>
              Cerrar <br /> sesión
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SideBarMenuClient;
