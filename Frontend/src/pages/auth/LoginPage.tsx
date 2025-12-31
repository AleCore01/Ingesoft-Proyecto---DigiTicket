"use client"

import type React from "react"
import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";

import TextInput from "../../components/Inputs/TextInput"
import PasswordInput from "../../components/Inputs/PasswordInput"
import Button from "../../components/Buttons/Button"
import RightPanel from "../../components/Layout/RightPanel"
import useLoginForm from "../../hooks/useLoginForm"
import logoPng from "../../assets/images/logo_blanco.png";

const LoginPage: React.FC = () => {
  const { formState, updateField, submitForm } = useLoginForm()
  const { setUser } = useAuth();
  const ROLE_HOME: Record<"ADMIN" | "CLIENT", string> = { 
    ADMIN: "/homeAdmin", 
    CLIENT: "/homeClient" 
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await submitForm();
    if (!res) return; // si hubo error, submitForm ya setea el mensaje

    console.log('🔑 Login response:', res);

    // Normaliza la forma del usuario devuelto por el backend
   const rawUser =
      (res as any).user ??
      ((res as any).id
        ? { id: (res as any).id, role: (res as any).role, name: (res as any).name }
        : undefined);
    if (!rawUser?.role) {
      console.error('❌ No se pudo extraer el usuario de la respuesta');
      return;
    }

    // Asegura formato ADMIN/CLIENT (por si viene "ROLE_ADMIN")
    const role = String(rawUser.role).replace(/^ROLE_/, "") as "ADMIN" | "CLIENT";
    const normalizedUser = { ...rawUser, role } as { id: string; name: string; role: "ADMIN" | "CLIENT" };

    console.log('👤 Usuario normalizado:', normalizedUser);

    // Actualiza contexto
    // Como useLoginForm ya persiste en localStorage, setUser actualizará el estado del contexto
    setUser(normalizedUser);
    
    console.log('✅ Usuario guardado en contexto');

    // Navega con hard reload para asegurar que la página se carga correctamente
    // Especialmente útil cuando vienes de un registro previo
    const targetRoute = ROLE_HOME[normalizedUser.role] ?? "/eventos";
    console.log('🚀 Navegando a:', targetRoute);
    
    // Usar window.location.href para forzar recarga completa y evitar problemas de estado
    window.location.href = targetRoute;
  }
  const [params] = useSearchParams();
  useEffect(() => {
    const preset = params.get("email");
    if (preset) updateField("email", preset);
  }, [params, updateField]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Panel - Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h1 className="text-4xl font-bold text-gray-900 mb-8 text-balance">Inicio de Sesión</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <TextInput
                  label="Correo electrónico"
                  type="email"
                  placeholder="correo.electronico@email.com"
                  value={formState.data.email}
                  onChange={(value) => updateField("email", value)}
                  error={formState.errors.email}
                  required
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="********"
                  value={formState.data.password}
                  onChange={(value) => updateField("password", value)}
                  error={formState.errors.password}
                  required
                />

                <div className="text-right">
                  <Link to="/recoverpassword"
                    type="button"
                    className="text-sm text-gray-500 hover:text-gradient-middle transition-colors duration-200"
                  >
                    Olvide mi contraseña
                  </Link>
                </div>

                {formState.errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm" role="alert">
                      {formState.errors.general}
                    </p>
                  </div>
                )}

                <Button type="submit" loading={formState.isLoading} disabled={formState.isLoading} className="mt-8">
                  INGRESAR
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  ¿Aún no tienes una cuenta?{" "}
                  <Link to="/register" className="text-gradient-middle hover:underline font-medium">Regístrate</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Gradient */}
          <RightPanel />
        </div>

        {/* Mobile gradient panel */}
        <div className="lg:hidden bg-DigiTicket-gradient p-8 text-white text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <img src={logoPng} alt="DigiTicket Logo" className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold mb-2">DigiTicket</h2>
          <p className="text-sm opacity-80">2025©Bytecraft. Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
