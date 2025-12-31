// Logging centralizado (bloque anterior eliminado por limpieza)

// src/services/http.ts
const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const LOG_ENABLED = (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') && import.meta.env.VITE_SILENT !== 'true';
const log = (...args: any[]) => { if (LOG_ENABLED) console.log(...args); };
const warn = (...args: any[]) => { if (LOG_ENABLED) console.warn(...args); };
const errLog = (...args: any[]) => { if (LOG_ENABLED) console.error(...args); };

export class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type RequestOpts = RequestInit & { timeout?: number };

async function request<T>(method: string, url: string, body?: unknown, init?: RequestOpts): Promise<T> {
  const controller = new AbortController();
  const signal = init?.signal ?? controller.signal;
  const timer = init?.timeout ? setTimeout(() => controller.abort(), init.timeout) : undefined;

  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    // 🔑 Extraer userId del objeto user almacenado
    let userId: string | null = null;
    if (user) {
      try {
        const userObj = JSON.parse(user);
        // Intentar diferentes propiedades donde puede estar el ID
        const userIdValue = userObj.id || 
                           userObj.userId || 
                           userObj.user_id ||
                           userObj.sub;
        
        // ⚠️ IMPORTANTE: Convertir a string para el header (los headers son siempre strings)
        // El backend lo parseará como Integer
        userId = userIdValue ? String(userIdValue) : null;
        
        log('👤 [http.ts] User extraído:', { userObj, userId });
      } catch (e) {
        warn('⚠️ No se pudo parsear user de localStorage:', e);
      }
    }
    
    // Si no hay userId en localStorage, intentar un valor por defecto para desarrollo
    if (!userId) {
      warn('⚠️ No se encontró userId. Usando ID por defecto: 1');
      userId = '1'; // ID por defecto para desarrollo
    }

    // �👇 construir URL final con params (soporta estilo axios)
    let full = `${BASE_URL}/${url}`.replace(/([^:]\/)\/+/g, "$1");
    log('🔧 [http.ts] URL construida:', { BASE_URL, url, full });
    const p = (init as any)?.params;
    if (p && typeof p === "object") {
      const usp = new URLSearchParams();
      Object.entries(p).forEach(([k, v]) => {
        if (v !== undefined && v !== null) usp.append(k, String(v));
      });
      const sep = full.includes("?") ? "&" : "?";
      full += sep + usp.toString();
    }

    const res = await fetch(full, {
      ...init,
      method,
      credentials: init?.credentials ?? "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { "X-User-Id": userId } : {}), // ✅ Header requerido por el backend del carrito
        ...(init?.headers || {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
      signal,
    });

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => "");

    if (!res.ok) {
      if (res.status === 401) {
        warn('🔒 Token expirado o inválido. Redirigiendo al login...');
        try { 
          localStorage.removeItem("token"); 
          localStorage.removeItem("user"); 
        } catch {}
        
        // Mostrar mensaje al usuario antes de redirigir
        if (location.pathname !== "/login") {
          alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          location.href = "/login";
        }
      }
      
      // 🔍 Log detallado del error para debugging
      errLog('🚨 HTTP Error:', {
        status: res.status,
        url: full,
        method,
        payload,
        body,
        errorMessage: (body as any)?.message || (body as any)?.error || 'No error message'
      });
      
      const msg =
        (payload && typeof payload === "object" && ("message" in (payload as any) ? (payload as any).message : (payload as any).error)) ||
        (typeof payload === "string" && payload) || `HTTP ${res.status}`;
      throw new (class ApiError extends Error { status = res.status; data = payload; }) (msg);
    }

    return (isJson ? (payload as T) : (undefined as unknown as T));
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const api = {
  get: <T>(url: string, init?: RequestOpts) => request<T>("GET", url, undefined, init),
  post: <T>(url: string, body?: unknown, init?: RequestOpts) => request<T>("POST", url, body, init),
  put:  <T>(url: string, body?: unknown, init?: RequestOpts) => request<T>("PUT", url, body, init),
  patch:<T>(url: string, body?: unknown, init?: RequestOpts) => request<T>("PATCH", url, body, init),
  delete:<T>(url: string, init?: RequestOpts) => request<T>("DELETE", url, undefined, init),
  upload: <T>(url: string, formData: FormData, init?: RequestOpts) => upload<T>(url, formData, init),
};

// Multipart upload helper (FormData). Do not set Content-Type manually.
export async function upload<T>(url: string, formData: FormData, init?: RequestOpts): Promise<T> {
  const controller = new AbortController();
  const signal = init?.signal ?? controller.signal;
  const timer = init?.timeout ? setTimeout(() => controller.abort(), init.timeout) : undefined;

  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    let userId: string | null = null;
    if (user) {
      try {
        const userObj = JSON.parse(user);
        userId = userObj.id?.toString() || userObj.userId?.toString();
      } catch {}
    }

    let full = `${BASE_URL}/${url}`.replace(/([^:]\/)\/+/g, "$1");
    const res = await fetch(full, {
      ...init,
      method: "POST",
      credentials: init?.credentials ?? "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { "X-User-Id": userId } : {}),
        ...(init?.headers || {}),
      } as any,
      body: formData,
      signal,
    });

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => "");

    if (!res.ok) {
      if (res.status === 401) {
        try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch {}
        if (location.pathname !== "/login") {
          alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          location.href = "/login";
        }
      }
      const msg = (payload && typeof payload === "object" && (payload as any).message) || (typeof payload === "string" && payload) || `HTTP ${res.status}`;
      throw new (class ApiError extends Error { status = res.status; data = payload; }) (msg);
    }

    return (isJson ? (payload as T) : (undefined as unknown as T));
  } finally {
    if (timer) clearTimeout(timer);
  }
}
