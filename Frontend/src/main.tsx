import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import "./styles/globals.css";

// Contexto de auth
import { AuthProvider, useAuth, type Role } from "./context/AuthProvider";
import { CartProvider } from "./context/CartContext";
import { EventsCacheProvider } from "./context/EventsCache";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";

// Páginas públicas
import LandingPage from "./pages/Public/LandingPage";
import EventDetailPagePublic from "./pages/Public/EventDetailPagePublic";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import RecoverPasswordPage from "./pages/auth/RecoverPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyCodePage from "./pages/auth/VerifyCodePage";
import HealthPage from "./pages/HealthPage";

// Páginas protegidas
import HomePageAdmin from "./pages/HomePageAdmin";
import HomePageClient from "./pages/HomePageClient";
import EventsListPage from "./pages/events/EventsListPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CreateEvent from "./pages/events/CreateEvent";
import EditEvent from "./pages/events/EditEvent";
import LocalListPage from "./pages/locals/LocalListPage";
import LocalDetailPage from "./pages/locals/LocalDetailPage";
import EditLocal from "./pages/locals/EditLocal";
import CreateLocal from "./pages/locals/CreateLocal";
import UsersListPage from "./pages/users/UsersListPage";
import AdminsListPage from "./pages/administrators/AdminsListPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import CreateAdmin from "./pages/administrators/CreateAdmin";
import EditAdmin from "./pages/administrators/EditAdmin";

import EventDetailPageClient from "./pages/EventDetailPageClient"
import TicketClient from "./pages/tickets/TicketClient";
import ProfileClient from "./pages/users/ProfileClient";
import CartClient from "./pages/cart/CartClient";

/** --------- GUARDS --------- */
function RequireAuth() {
  const { user } = useAuth();
  const loc = useLocation();
  
  // Debug logging
  console.log('🔐 RequireAuth check:', { user, path: loc.pathname });
  
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}

function AllowRoles({ roles }: { roles: Role[] }) {
  const { hasRole, user } = useAuth();
  const isAllowed = hasRole(...roles);
  
  // Debug logging
  console.log('👮 AllowRoles check:', { user, roles, isAllowed });
  
  return isAllowed ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
/** --------------------------- */

function Forbidden() {
  return <div className="p-6 text-center">403 • No autorizado</div>;
}

// Asegurar que solo se monta una vez
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <EventsCacheProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
          {/* Públicas */}
          <Route path="/landingPage" element={<LandingPage />} />
          <Route path="/eventosPublic/:id"element={<EventDetailPagePublic />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/recoverpassword" element={<RecoverPasswordPage />} />
          <Route path="/resetpassword" element={<ResetPasswordPage />} />
          <Route path="/verifycode" element={<VerifyCodePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Protegidas: requiere sesión */}
          <Route element={<RequireAuth />}>
            {/* HOME para ADMIN */}
            <Route element={<AllowRoles roles={["ADMIN"]} />}>
              <Route path="/homeAdmin" element={<HomePageAdmin />} />
              <Route path="/settings" element={<SystemSettingsPage />} />
            </Route>
          
            {/* HOME para CLIENT */}
            <Route element={<AllowRoles roles={["CLIENT"]} />}>
              <Route path="/homeClient" element={<HomePageClient />} />
              <Route path="/eventosCliente/:id" element={<EventDetailPageClient />} />
              <Route path="/ticketClient" element={<TicketClient />} />
              <Route path="/profileClient" element={<ProfileClient />} />
              <Route path="/cartClient" element={<CartClient />} />
            </Route>

            {/* EVENTOS: accesible para ADMIN */}
            <Route element={<AllowRoles roles={["ADMIN"]} />}>
              <Route path="/eventos" element={<EventsListPage />} />
              <Route
                path="/eventos/visualizar/:id"
                element={<EventDetailPage />}
              />
            </Route>

            {/* EVENTOS (acciones sensibles): solo ADMIN */}
            <Route element={<AllowRoles roles={["ADMIN"]} />}>
              <Route
                path="/eventos/visualizar/:id/editar"
                element={<EditEvent />}
              />
              <Route path="/eventos/crear" element={<CreateEvent />} />

              {/* LOCALES: solo ADMIN */}
              <Route path="/locales" element={<LocalListPage />} />
              <Route
                path="/locales/visualizar/:id"
                element={<LocalDetailPage />}
              />
              <Route
                path="/locales/visualizar/:id/editar"
                element={<EditLocal />}
              />
              <Route path="/locales/crear" element={<CreateLocal />} />
            </Route>

            {/* USUARIOS: solo ADMIN */}
            <Route element={<AllowRoles roles={["ADMIN"]} />}>
              <Route path="/usuarios" element={<UsersListPage />} />
            </Route>

            {/* ADMINISTRADORES: solo SUPER_ADMIN */}
            <Route element={<AllowRoles roles={["ADMIN"]} />}>
              <Route path="/administradores" element={<AdminsListPage />} />
              <Route path="/administradores/crear" element={<CreateAdmin />} />
              <Route path="/administradores/editar/:id" element={<EditAdmin />} />
            </Route>
          </Route>

          {/* Redirecciones y 404 */}
          <Route path="/" element={<Navigate to="/landingPage" replace />} />
          <Route path="*" element={<div className="p-6 text-center">404</div>} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </EventsCacheProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);