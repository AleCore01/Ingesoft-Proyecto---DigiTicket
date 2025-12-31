import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import logo from "../../assets/images/logo_blanco.png";
import NumericInput from "../../components/Inputs/NumericInput";
import EmailInput, { isValidEmail } from "../../components/Inputs/EmailInput";
import Select from "../../components/Inputs/Select";
import { authService } from "../../services/auth.service";

type FormState = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirm: string;
  termsAccepted: boolean;
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  documentType: "",
  documentNumber: "",
  birthDate: "",
  phoneNumber: "",
  email: "",
  password: "",
  confirm: "",
  termsAccepted:true,
};

const documentTypes = [
  { value: "", label: "Seleccionar" },
  { value: "dni", label: "DNI" },
  { value: "ce", label: "Carné de extranjería" },
  { value: "pasaporte", label: "Pasaporte" },
];

// Eliminado DOC_MAX (no usado); longitud fija requerida = 8

const DOC_MAP: Record<string, string> = {
  dni: "DNI",
  ce: "CE",
  pasaporte: "PASSPORT", //  "PASAPORTE"
};


function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-500 text-sm mt-1">{msg}</p>;
}

function maxBirthDate18Y(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({} as any);
  const [wantsNotifications, setWantsNotifications] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);
  const [done, setDone] = useState(false); // 👈 overlay de éxito
  const navigate = useNavigate(); // 👈

  // Forzar document number a 8 dígitos (requerimiento)
  const docMax = 8;
  const birthMax = maxBirthDate18Y();

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = "Ingresa tus nombres";
    if (!form.lastName.trim()) e.lastName = "Ingresa tus apellidos";
    if (!form.documentType) e.documentType = "Selecciona un tipo";
    if (!form.documentNumber) e.documentNumber = "Ingresa tu número";
    else if (form.documentNumber.length !== 8) {
      e.documentNumber = "Debe tener 8 dígitos";
    }
    if (!form.birthDate) e.birthDate = "Selecciona tu fecha";
    else if (form.birthDate > birthMax) e.birthDate = "Debes ser mayor de 18 años";
    if (!form.phoneNumber) e.phoneNumber = "Ingresa tu teléfono";
    else if (!/^9\d{8}$/.test(form.phoneNumber)) {
      e.phoneNumber = "Debe comenzar con 9 y tener 9 dígitos";
    }
    if (!form.email) e.email = "Ingresa tu correo";
    else if (!isValidEmail(form.email)) e.email = "Correo no válido";
    if (!form.password) e.password = "Ingresa una contraseña";
    else if (form.password.length < 8) e.password = "Debe contener al menos 8 caracteres";
    else if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = "Usa mayúscula, minúscula y un número";
    }
    if (!form.confirm) e.confirm = "Confirma tu contraseña";
    else if (form.confirm !== form.password) e.confirm = "Las contraseñas no coinciden";
    return e;
  }, [form, birthMax]);

  const hasErrors = Object.keys(errors).length > 0;

  // Normaliza entradas numéricas: documento -> solo dígitos, max 8; teléfono -> solo dígitos, max 9 y se valida que empiece con 9
  const set = (key: keyof FormState) => (value: string) => {
    let v = value;
    if (key === "documentNumber") {
      v = v.replace(/\D/g, "").slice(0, 8);
    }
    if (key === "phoneNumber") {
      // solo dígitos y máximo 9
      v = v.replace(/\D/g, "").slice(0, 9);
      // forzar que comience con 9: si hay una '9' más adelante, desplazar para que empiece por esa; si no, dejar vacío
      if (v && v[0] !== "9") {
        const idx = v.indexOf("9");
        v = idx === -1 ? "" : v.slice(idx, idx + 9);
      }
    }
    setForm((s) => ({ ...s, [key]: v }));
  };

  const handleBlur = (key: keyof FormState) => () =>
    setTouched((t) => ({ ...t, [key]: true }));

  const goLogin = () => {
    navigate(`/login?email=${encodeURIComponent(form.email)}`, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(undefined);
    setTouched({
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      birthDate: true,
      phoneNumber: true,
      email: true,
      password: true,
      confirm: true,
      termsAccepted:true,
    });
    if (hasErrors) return;

    setSubmitting(true);
    try {
      await authService.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        documentType: DOC_MAP[form.documentType] ?? form.documentType.toUpperCase(),
        documentNumber: form.documentNumber,
        birthDate: form.birthDate,      // "YYYY-MM-DD"
        phoneNumber: form.phoneNumber,
        termsAccepted: form.termsAccepted,
      });

      // Limpia y muestra overlay
      setDone(true);
      setForm(initialState);
      setTouched({} as any);
      setWantsNotifications(false);

      // Redirige al login con email prellenado en 2s
      setTimeout(goLogin, 2000);
    } catch (err: any) {
      setGeneralError(err?.message || "No pudimos crear tu cuenta. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-poppins relative">
      {/* Izquierda */}
      <aside className="hidden lg:flex items-center justify-center bg-DigiTicket-gradient relative">
        <div className="w-10/12 max-w-[540px] text-white">
          <div className="flex flex-col items-center gap-6">
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <img src={logo} alt="DigiTicket Logo" className="w-20 h-20" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-sm">DigiTicket</h1>
          </div>
        </div>
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-xs">
          2025© Bytecraft. Todos los derechos reservados
        </p>
      </aside>

      {/* Derecha */}
      <main className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-10">Crear una cuenta</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Error general */}
            {generalError && (
              <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg -mt-2">
                <p className="text-red-600 text-sm" role="alert">
                  {generalError}
                </p>
              </div>
            )}

            {/* Nombres */}
            <div>
              <label className="block text-sm font-semibold mb-2">Nombres</label>
              <input
                type="text"
                placeholder="Nombres"
                value={form.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
                onBlur={handleBlur("firstName")}
                autoComplete="given-name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
              />
              {touched.firstName && <FieldError msg={errors.firstName} />}
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-semibold mb-2">Apellidos</label>
              <input
                type="text"
                placeholder="Apellidos"
                value={form.lastName}
                onChange={(e) => set("lastName")(e.target.value)}
                onBlur={handleBlur("lastName")}
                autoComplete="family-name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
              />
              {touched.lastName && <FieldError msg={errors.lastName} />}
            </div>

            {/* Tipo de documento */}
            <Select
              label="Tipo de documento"
              value={form.documentType}
              onChange={set("documentType")}
              options={documentTypes}
              required
              error={touched.documentType ? errors.documentType : undefined}
            />

            {/* Número de documento */}
            <NumericInput
              label="Número de documento"
              value={form.documentNumber}
              onChange={set("documentNumber")}
              maxLength={docMax}
              placeholder={form.documentType ? `Máx. ${docMax} dígitos` : "Primero selecciona un tipo"}
              required
              error={touched.documentNumber ? errors.documentNumber : undefined}
              autoComplete="off"
            />

            {/* Fecha de nacimiento */}
            <div>
              <label className="block text-sm font-semibold mb-2">Fecha de nacimiento</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => set("birthDate")(e.target.value)}
                onBlur={handleBlur("birthDate")}
                max={maxBirthDate18Y()}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
              />
              {touched.birthDate && <FieldError msg={errors.birthDate} />}
            </div>

            {/* Teléfono */}
            <NumericInput
              label="Teléfono"
              value={form.phoneNumber}
              onChange={set("phoneNumber")}
              maxLength={9}
              placeholder="9XXXXXXXX"
              required
              error={touched.phoneNumber ? errors.phoneNumber : undefined}
              autoComplete="tel"
            />

            {/* Correo */}
            <div className="md:col-span-2">
              <EmailInput
                value={form.email}
                onChange={set("email")}
                required
                error={touched.email ? errors.email : undefined}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold mb-2">Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8, mayus, minus y número"
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
                onBlur={handleBlur("password")}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
              />
              {touched.password && <FieldError msg={errors.password} />}
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-sm font-semibold mb-2">Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={form.confirm}
                onChange={(e) => set("confirm")(e.target.value)}
                onBlur={handleBlur("confirm")}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
              />
              {touched.confirm && <FieldError msg={errors.confirm} />}
            </div>

            {/* Checkbox de notificaciones */}
            <div className="md:col-span-2 mt-1">
              <label className="flex items-start gap-3 select-none">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-gray-300"
                  checked={wantsNotifications}
                  onChange={(e) => setWantsNotifications(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">¿Te gustaría recibir notificaciones sobre novedades y eventos?</span>{" "}
                  Puedes ajustar tus preferencias desde tu perfil en cualquier momento.
                </span>
              </label>
            </div>

            {/* Botón */}
            <div className="md:col-span-2 mt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-DigiTicket-gradient text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "CREANDO..." : "CREAR"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Overlay de éxito + redirección */}
      {done && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 text-center w-[min(90vw,460px)]">
            <p className="text-lg font-semibold text-gray-800">¡Cuenta creada!</p>
            <p className="text-sm text-gray-500 mt-1">
              Te redirigiremos al inicio de sesión…
            </p>
            <button
              onClick={goLogin}
              className="mt-4 px-5 py-2 rounded-xl bg-DigiTicket-gradient text-white font-semibold"
            >
              Ir al login ahora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
