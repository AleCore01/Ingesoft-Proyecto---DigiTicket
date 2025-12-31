import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import logo from "../../assets/images/logo_blanco.png";
import { authService } from "../../services/auth.service";

type VerifyCodeResponse = {
  resetToken: string; // token que usarás en /reset-password
};

const CODE_LEN = 6;

export default function VerifyCodePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get("email") || "";
  const maskedEmail = useMemo(() => {
    if (!email) return "";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const safeUser =
      user.length <= 2 ? user[0] + "*" : user.slice(0, 2) + "*".repeat(Math.max(1, user.length - 2));
    return `${safeUser}@${domain}`;
  }, [email]);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();

  const onChangeCode = (v: string) => {
    const clean = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, CODE_LEN);
    setCode(clean);
    setError(undefined);
  };

  const validate = () => {
    if (!email) {
      setError("Falta el correo. Vuelve al paso anterior.");
      return false;
    }
    if (code.length !== CODE_LEN) {
      setError(`Ingresa el código de ${CODE_LEN} dígitos.`);
      return false;
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(undefined);
    setInfo(undefined);

    try {
      // Llama al service (POST /auth/verify-reset-code)
      const data = (await authService.verifyCode(email.trim(), code)) as VerifyCodeResponse;
      navigate(`/resetpassword?token=${encodeURIComponent(data.resetToken)}`);
    } catch (err: any) {
      setError(err?.message || "No se pudo validar el código.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) return;
    setLoading(true);
    setError(undefined);
    setInfo(undefined);
    try {
      // Llama al service (POST /auth/request-reset)
      await authService.requestReset(email.trim());
      setInfo("Hemos reenviado un nuevo código a tu correo.");
    } catch (err: any) {
      setError(err?.message || "No pudimos reenviar el código. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white font-poppins">
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl w-full">
        {/* Columna izquierda */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
            Introduce el código que <br /> enviamos a tu correo
          </h1>

          {!email && (
            <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Falta el correo de destino. Vuelve a{" "}
                <Link to="/recover" className="underline font-medium">
                  Recuperar contraseña
                </Link>
                .
              </p>
            </div>
          )}

          {email && (
            <p className="text-sm text-gray-500 mb-6">
              Enviado a: <span className="font-medium text-gray-700">{maskedEmail}</span>
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-semibold mb-2">Código de verificación</label>
              <input
                type="password"             // se “oculta” el código
                placeholder="******"
                value={code}
                onChange={(e) => onChangeCode(e.target.value)}
                maxLength={CODE_LEN}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none
                           focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
                aria-invalid={Boolean(error)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm" role="alert">
                  {error}
                </p>
              </div>
            )}

            {info && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-DigiTicket-gradient text-white font-semibold py-3 px-6 rounded-xl
                         hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "VALIDANDO..." : "CONTINUAR"}
            </button>

            <div className="pt-1">
              <button
                type="button"
                onClick={onResend}
                disabled={loading || !email}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Reenviar código
              </button>
            </div>
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
