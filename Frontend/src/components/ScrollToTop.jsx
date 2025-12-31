import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que fuerza el scroll al top cuando cambia la ruta
 * Debe colocarse dentro del BrowserRouter pero fuera de Routes
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
