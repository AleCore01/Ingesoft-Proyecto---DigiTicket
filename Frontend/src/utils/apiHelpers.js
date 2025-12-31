/**
 * Helpers para normalizar respuestas de API
 * 
 * El backend puede devolver datos en diferentes estructuras:
 * - Array directo
 * - { data: { content: [...] } }
 * - { data: [...] }
 * - { content: [...] }
 * 
 * Estas funciones normalizan todas esas variantes.
 */

/**
 * Normaliza una respuesta de API que debería ser un array
 * 
 * @param {any} response - Respuesta de la API
 * @returns {Array} - Array normalizado (vacío si no se puede parsear)
 * 
 * @example
 * const events = normalizeApiResponse(await eventsService.getAll());
 */
export function normalizeApiResponse(response) {
  // Si ya es un array, retornarlo directamente
  if (Array.isArray(response)) {
    return response;
  }

  // Intentar extraer array de estructuras anidadas
  if (Array.isArray(response?.data?.content)) {
    return response.data.content;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  // Si no se pudo parsear, retornar array vacío
  return [];
}

/**
 * Normaliza una respuesta de API que debería ser un objeto
 * 
 * @param {any} response - Respuesta de la API
 * @returns {Object|null} - Objeto normalizado o null
 * 
 * @example
 * const event = normalizeApiObject(await eventsService.getById(id));
 */
export function normalizeApiObject(response) {
  if (!response) return null;

  // Si viene en response.data
  if (response.data && typeof response.data === 'object') {
    return response.data;
  }

  // Si ya es un objeto simple
  if (typeof response === 'object' && !Array.isArray(response)) {
    return response;
  }

  return null;
}

/**
 * Extrae un campo específico de una respuesta de API
 * 
 * @param {any} response - Respuesta de la API
 * @param {string} fieldName - Nombre del campo a extraer
 * @param {any} defaultValue - Valor por defecto si no se encuentra
 * @returns {any} - Valor del campo o defaultValue
 * 
 * @example
 * const totalPages = extractField(response, 'totalPages', 1);
 */
export function extractField(response, fieldName, defaultValue = null) {
  if (!response) return defaultValue;

  // Buscar en diferentes niveles de anidación
  if (response[fieldName] !== undefined) {
    return response[fieldName];
  }

  if (response.data?.[fieldName] !== undefined) {
    return response.data[fieldName];
  }

  if (response.data?.content?.[fieldName] !== undefined) {
    return response.data.content[fieldName];
  }

  return defaultValue;
}

/**
 * Verifica si una respuesta de API indica éxito
 * 
 * @param {any} response - Respuesta de la API
 * @returns {boolean} - true si la respuesta es exitosa
 * 
 * @example
 * if (isSuccessResponse(response)) {
 *   // Procesar datos
 * }
 */
export function isSuccessResponse(response) {
  if (!response) return false;

  // Verificar código de estado HTTP
  if (response.status >= 200 && response.status < 300) {
    return true;
  }

  // Verificar flag de éxito
  if (response.ok === true || response.success === true) {
    return true;
  }

  // Por defecto, asumir éxito si no hay indicadores de error
  return !response.error && !response.errorMessage;
}

/**
 * Extrae un mensaje de error de una respuesta de API
 * 
 * @param {any} error - Error de la API
 * @returns {string} - Mensaje de error legible
 * 
 * @example
 * catch (error) {
 *   const message = extractErrorMessage(error);
 *   alert(message);
 * }
 */
export function extractErrorMessage(error) {
  if (!error) return 'Error desconocido';

  // Mensaje directo
  if (typeof error === 'string') return error;

  // Diferentes ubicaciones del mensaje
  const message =
    error.message ||
    error.errorMessage ||
    error.data?.message ||
    error.data?.errorMessage ||
    error.payload?.message ||
    error.response?.data?.message ||
    error.statusText ||
    'Error al procesar la solicitud';

  return message;
}

/**
 * Verifica si un error es de red/conectividad
 * 
 * @param {any} error - Error a verificar
 * @returns {boolean} - true si es error de red
 */
export function isNetworkError(error) {
  if (!error) return false;

  return (
    error.message === 'Network Error' ||
    error.code === 'ERR_NETWORK' ||
    error.name === 'NetworkError' ||
    !navigator.onLine
  );
}

export default {
  normalizeApiResponse,
  normalizeApiObject,
  extractField,
  isSuccessResponse,
  extractErrorMessage,
  isNetworkError,
};
