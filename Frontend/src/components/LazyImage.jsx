import { useState, useEffect, useRef } from 'react';

/**
 * Componente de imagen con lazy loading
 * 
 * Solo carga la imagen cuando está visible en el viewport,
 * mejorando significativamente el rendimiento inicial.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.src - URL de la imagen a cargar
 * @param {string} props.alt - Texto alternativo
 * @param {string} [props.className] - Clases CSS
 * @param {string} [props.placeholder] - Imagen placeholder mientras carga
 * @param {Function} [props.onLoad] - Callback cuando la imagen se carga
 * @param {Function} [props.onError] - Callback si hay error al cargar
 * 
 * @example
 * <LazyImage
 *   src={event.imageUrl}
 *   alt={event.title}
 *   className="w-full h-48 object-cover"
 *   placeholder="/images/placeholder.jpg"
 * />
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="18"%3ECargando...%3C/text%3E%3C/svg%3E',
  onLoad,
  onError,
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src || !imgRef.current) return;

    // Usar IntersectionObserver para detectar cuando la imagen es visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Imagen visible, cargarla
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Comenzar a cargar 50px antes de que sea visible
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
      observer.disconnect();
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    // Fallback a placeholder si falla la carga
    setImageSrc(placeholder);
    if (onError) onError();
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...rest}
    />
  );
};

export default LazyImage;
