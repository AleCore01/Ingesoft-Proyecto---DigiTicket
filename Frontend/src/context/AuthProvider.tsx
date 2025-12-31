import { createContext, useContext, useState, useEffect } from "react";

export type Role = "ADMIN" | "CLIENT" | "SUPER_ADMIN";
export type User = { id: string; name: string; role: Role } | null;

type AuthCtx = {
  user: User;
  setUser: (u: User) => void;
  hasRole: (...roles: Role[]) => boolean;
  logout: () => void;
  isTokenExpired: () => boolean;
};

const Ctx = createContext<AuthCtx>({} as any);

// Hook para proteger rutas/operaciones críticas
export const useTokenCheck = () => {
  const { isTokenExpired, logout } = useAuth();
  
  const checkAndProceed = (operation: () => void | Promise<void>) => {
    if (isTokenExpired()) {
      alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      logout();
      window.location.href = '/login';
      return;
    }
    operation();
  };

  return { checkAndProceed };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // lee localStorage en el estado inicial (antes del 1er render)
  const [user, _setUser] = useState<User>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  // Verificar expiración de token periódicamente
  useEffect(() => {
    if (!user) return; // Solo verificar si hay usuario logueado

    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        handleSessionExpired();
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        const now = Date.now() / 1000;
        
        // Si el token ya expiró, cerrar sesión
        if (exp <= now) {
          handleSessionExpired();
        }
      } catch {
        handleSessionExpired();
      }
    };

    const handleSessionExpired = () => {
      alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      _setUser(null);
      window.location.href = '/login';
    };

    // Verificar cada 60 segundos
    const interval = setInterval(checkTokenExpiration, 60000);

    // Verificar inmediatamente al montar
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [user]);

  const hasRole = (...roles: Role[]) =>
    !!user && Array.isArray(roles) && roles.length > 0 && roles.includes(user.role);

  // persiste también cuando cambias el user
  const setUser = (u: User) => {
    _setUser(u);
    try {
      if (u) localStorage.setItem("user", JSON.stringify(u));
      else localStorage.removeItem("user");
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    _setUser(null);
  };

  // Verifica si el token está expirado o próximo a expirar
  const isTokenExpired = (): boolean => {
    const token = localStorage.getItem("token");
    if (!token) return true;

    try {
      // Decodifica el payload del JWT (formato: header.payload.signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp; // exp está en segundos desde epoch
      const now = Date.now() / 1000; // convertir a segundos
      
      // Considera expirado si queda menos de 1 minuto
      return exp - now < 60;
    } catch {
      return true;
    }
  };

  return <Ctx.Provider value={{ user, setUser, hasRole, logout, isTokenExpired }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);