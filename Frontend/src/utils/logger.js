/**
 * Logger condicional para desarrollo
 * 
 * En producción, los logs se omiten automáticamente excepto errors.
 * Esto mejora el rendimiento y evita exponer lógica de negocio.
 * 
 * @example
 * import { logger } from '@/utils/logger';
 * 
 * logger.log('✅ Operación exitosa', data);
 * logger.warn('⚠️ Advertencia', warning);
 * logger.error('❌ Error crítico', error);
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log normal - solo en desarrollo
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Advertencias - solo en desarrollo
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Errores - siempre se muestran (incluso en producción)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Info - solo en desarrollo
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Debug - solo en desarrollo
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log con grupo colapsable - solo en desarrollo
   */
  group: (label, callback) => {
    if (isDev) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Tabla - solo en desarrollo
   */
  table: (data) => {
    if (isDev) {
      console.table(data);
    }
  },
};

export default logger;
