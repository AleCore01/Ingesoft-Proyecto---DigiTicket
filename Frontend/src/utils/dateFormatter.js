/**
 * Utilidades de formateo de fechas
 * 
 * Centraliza todo el formateo de fechas para mantener consistencia
 * en toda la aplicación.
 * 
 * Locale: es-PE (Español - Perú)
 */

/**
 * Formatea una fecha en formato corto: DD/MM/YYYY
 * 
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: "29/11/2025")
 * 
 * @example
 * dateFormatter.toLocalDate("2025-11-29") // "29/11/2025"
 */
function toLocalDate(date) {
  if (!date) return '—';
  
  try {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return '—';
  }
}

/**
 * Formatea una fecha en formato largo: DD de Mes, YYYY
 * 
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: "29 de Noviembre, 2025")
 * 
 * @example
 * dateFormatter.toLongDate("2025-11-29") // "29 de Noviembre, 2025"
 */
function toLongDate(date) {
  if (!date) return '—';
  
  try {
    return new Date(date).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    return '—';
  }
}

/**
 * Formatea una fecha con día de la semana
 * 
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: "Viernes, 29 de Noviembre, 2025")
 * 
 * @example
 * dateFormatter.toLongDateWithDay("2025-11-29")
 */
function toLongDateWithDay(date) {
  if (!date) return '—';
  
  try {
    return new Date(date).toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    return '—';
  }
}

/**
 * Formatea solo la hora: HH:MM
 * 
 * @param {string|Date} date - Fecha con hora
 * @returns {string} - Hora formateada (ej: "14:30")
 * 
 * @example
 * dateFormatter.toTime("2025-11-29T14:30:00") // "14:30"
 */
function toTime(date) {
  if (!date) return '—';
  
  try {
    return new Date(date).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return '—';
  }
}

/**
 * Formatea fecha y hora juntos
 * 
 * @param {string|Date} date - Fecha con hora
 * @returns {Object} - { date: "DD de Mes", time: "HH:MM" }
 * 
 * @example
 * dateFormatter.toDateTime("2025-11-29T14:30:00")
 * // { date: "29 de Noviembre", time: "14:30" }
 */
function toDateTime(date) {
  if (!date) return { date: '—', time: '—' };
  
  try {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
      }),
      time: d.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
  } catch (error) {
    return { date: '—', time: '—' };
  }
}

/**
 * Formatea una fecha en formato ISO (YYYY-MM-DD)
 * Útil para inputs tipo date
 * 
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha en formato ISO
 * 
 * @example
 * dateFormatter.toISO(new Date()) // "2025-11-29"
 */
function toISO(date) {
  if (!date) return '';
  
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
}

/**
 * Calcula la diferencia entre dos fechas en días
 * 
 * @param {string|Date} date1 - Primera fecha
 * @param {string|Date} date2 - Segunda fecha
 * @returns {number} - Diferencia en días
 * 
 * @example
 * dateFormatter.daysBetween("2025-11-29", "2025-12-01") // 2
 */
function daysBetween(date1, date2) {
  if (!date1 || !date2) return 0;
  
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d2 - d1);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
}

/**
 * Verifica si una fecha es en el pasado
 * 
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean} - true si la fecha ya pasó
 * 
 * @example
 * dateFormatter.isPast("2024-01-01") // true
 */
function isPast(date) {
  if (!date) return false;
  
  try {
    return new Date(date) < new Date();
  } catch (error) {
    return false;
  }
}

/**
 * Verifica si una fecha es en el futuro
 * 
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean} - true si la fecha es futura
 * 
 * @example
 * dateFormatter.isFuture("2026-01-01") // true
 */
function isFuture(date) {
  if (!date) return false;
  
  try {
    return new Date(date) > new Date();
  } catch (error) {
    return false;
  }
}

/**
 * Formatea fecha relativa (hace X días, en X días)
 * 
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Formato relativo
 * 
 * @example
 * dateFormatter.relative("2025-11-28") // "hace 1 día"
 * dateFormatter.relative("2025-11-30") // "en 1 día"
 */
function relative(date) {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    if (diffDays === -1) return 'ayer';
    if (diffDays > 0) return `en ${diffDays} días`;
    return `hace ${Math.abs(diffDays)} días`;
  } catch (error) {
    return '—';
  }
}

export const dateFormatter = {
  toLocalDate,
  toLongDate,
  toLongDateWithDay,
  toTime,
  toDateTime,
  toISO,
  daysBetween,
  isPast,
  isFuture,
  relative,
};

export default dateFormatter;
