import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo_blanco.png";
import { authService } from "../../services/auth.service";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string>("");
  const [generalError, setGeneralError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setGeneralError("");
    setSuccess(false);

    if (!validateEmail(email)) {
      setFieldError("Por favor, ingresa un correo válido");
      return;
    }

    setLoading(true);
    try {
      // Llamada al backend (POST /auth/request-reset)
      await authService.requestReset(email.trim());
      setSuccess(true);
      // Redirige a la pantalla para ingresar el código
      navigate(`/verifycode?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      setGeneralError(err?.message || "Hubo un error al procesar tu solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white font-poppins">
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl w-full">
        {/* Columna izquierda */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6">
            Ingresa los datos requeridos <br /> para restablecer tu contraseña
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            {/* Error general */}
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm" role="alert">
                  {generalError}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo.electronico@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none
                           focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all"
              />
              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
              {success && (
                <p className="text-green-600 text-sm mt-1">
                  ✅ Te hemos enviado un correo con instrucciones
                </p>
              )}
            </div>

            {/* Botón bien alineado (no Link) */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-DigiTicket-gradient text-white font-semibold py-3 px-6 rounded-xl
                         hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "ENVIANDO..." : "ENVIAR CÓDIGO"}
            </button>
          </form>
        </div>

        {/* Columna derecha (logo grande) */}
        <div className="flex justify-center">
          <img src={logo} alt="DigiTicket Logo" className="w-72 h-72 object-contain" />
        </div>
      </div>
    </div>
  );
}
