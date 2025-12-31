import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function loginRequest(email: string, password: string) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
  } catch (e) {
    // Si es un objeto de respuesta (error HTTP), propagar tal cual
    if (e && typeof e === 'object' && !(e instanceof Error)) {
      return Promise.reject(e)
    }
    return Promise.reject({ message: 'Error de red' })
  }
}
