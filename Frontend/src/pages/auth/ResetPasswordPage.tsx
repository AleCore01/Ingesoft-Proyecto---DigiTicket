import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo_blanco.png";
import PasswordInput from "../../components/Inputs/PasswordInput";
import { authService } from "../../services/auth.service";

// Reglas de complejidad
const strong = (pwd: string) =>
  pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd);

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || ""; // /reset-password?token=abc

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [errors, setErrors] = useState<{ new?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!token) e.general = "El enlace no es válido o ha expirado";
    if (!newPwd) e.new = "Ingresa la nueva contraseña";
    else if (!strong(newPwd)) e.new = "Usa al menos 8 caracteres, mayúscula, minúscula y número";
    if (!confirmPwd) e.confirm = "Confirma la nueva contraseña";
    else if (confirmPwd !== newPwd) e.confirm = "Las contraseñas no coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // ✅ llamada mediante service (solo token + nueva contraseña)
      await authService.resetPassword(token, newPwd);

      // ÉXITO
      setDone(true);
      setNewPwd("");
      setConfirmPwd("");

      // Redirige al login tras 2s
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err: any) {
      setErrors((p) => ({
        ...p,
        general: err?.message || "No se pudo cambiar la contraseña",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white font-poppins relative">
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl w-full">
        {/* Columna izquierda (formulario) */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Restablece tu contraseña</h1>

          <form onSubmit={onSubmit} className="space-y-5 max-w-md">
            <PasswordInput
              label="Nueva contraseña"
              placeholder="Mínimo 8, mayúscula, minúscula y número"
              value={newPwd}
              onChange={setNewPwd}
              error={errors.new}
              required
            />

            <PasswordInput
              label="Confirmar nueva contraseña"
              placeholder="Repite la nueva contraseña"
              value={confirmPwd}
              onChange={setConfirmPwd}
              error={errors.confirm}
              required
            />

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm" role="alert">
                  {errors.general}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-DigiTicket-gradient text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "CONFIRMANDO..." : "CONFIRMAR"}
            </button>
          </form>
        </div>

        {/* Columna derecha (logo grande) */}
        <div className="flex justify-center">
          <img src={logo} alt="DigiTicket Logo" className="w-72 h-72 object-contain" />
        </div>
      </div>

      {/* Overlay de éxito centrado (solo en éxito) */}
      {done && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 text-center w-[min(90vw,480px)]">
            <p className="text-lg font-semibold text-gray-800">¡Contraseña actualizada!</p>
            <div className="mt-4 mx-auto w-12 h-12 rounded-full border-2 border-green-500 grid place-items-center">
              <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-gray-500">Te redirigiremos al inicio de sesión…</p>
          </div>
        </div>
      )}
    </div>
  );
}