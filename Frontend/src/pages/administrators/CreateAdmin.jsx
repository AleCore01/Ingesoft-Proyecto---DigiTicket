import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import DateBadge from "../../components/Badges/DateBadge";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";

import ModalWarning from "../../components/Modal/ModalWarning";
import ModalCheck from "../../components/Modal/ModalCheck";

import { adminService } from "../../services/adminService";

const DOCUMENT_TYPES = [
  { id: "DNI", name: "DNI" },
  { id: "CE", name: "Carné de Extranjería" },
  { id: "PASSPORT", name: "Pasaporte" },
];

const STATUS_OPTIONS = [
  { id: "ACTIVE", name: "Activo" },
  { id: "BLOCKED", name: "Bloqueado" },
  { id: "DELETED", name: "Eliminado" },
];

function CreateAdmin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    documentType: "",
    documentNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    status: "ACTIVE", // fijo
    role: "ADMIN", // fijo
  });

  const setField = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));

  const [touched, setTouched] = useState({});
  const setFieldTouched = (f) =>
    setTouched((prev) => ({ ...prev, [f]: true }));

  // ---------------------------
  // VALIDACIÓN DINÁMICA
  // ---------------------------
  const getMaxLength = () => {
    if (form.documentType === "DNI") return 8;
    if (form.documentType === "PASSPORT") return 9;
    if (form.documentType === "CE") return 20;
    return 100; // por defecto
  };

  const handleDocumentNumberChange = (value) => {
    const max = getMaxLength();
    setField("documentNumber", value.slice(0, max));
  };

  // VALIDACIONES
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Nombre requerido";
  if (!form.lastName.trim()) errors.lastName = "Apellido requerido";
  if (!form.documentType) errors.documentType = "Seleccione un tipo";
  if (!form.documentNumber.trim())
    errors.documentNumber = "Número requerido";
  if (!form.email.trim()) errors.email = "Correo requerido";
  if (!form.password.trim()) errors.password = "Contraseña requerida";
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Las contraseñas no coinciden";

  // MODALES
  const [warningOpen, setWarningOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // SAVE ACTION
  const handleSaveWarning = () => {
    Object.keys(form).forEach((f) => setFieldTouched(f));
    if (Object.keys(errors).length > 0) return;
    setWarningOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setWarningOpen(false);

      await adminService.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        documentType: form.documentType,
        documentNumber: form.documentNumber.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        status: "ACTIVE", // fijo
        role: "ADMIN", // fijo
      });

      setSuccessOpen(true);
      setTimeout(() => {
        setSuccessOpen(false);
        navigate("/administradores");
      }, 1800);
    } catch (err) {
      console.error("Error registrando admin:", err);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-2">
              Registrar administrador
            </h1>
            <DateBadge />
          </div>

          <div className="bg-white shadow-md rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1">Nombres</label>
                <input
                  type="text"
                  placeholder="Nombres"
                  value={form.firstName}
                  onBlur={() => setFieldTouched("firstName")}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
                {touched.firstName && errors.firstName && (
                  <p className="text-red-500 text-sm">{errors.firstName}</p>
                )}
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-sm font-medium mb-1">Apellidos</label>
                <input
                  type="text"
                  placeholder="Apellidos"
                  value={form.lastName}
                  onBlur={() => setFieldTouched("lastName")}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
                {touched.lastName && errors.lastName && (
                  <p className="text-red-500 text-sm">{errors.lastName}</p>
                )}
              </div>

              {/* Tipo de documento */}
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de documento</label>
                <select
                  value={form.documentType}
                  onBlur={() => setFieldTouched("documentType")}
                  onChange={(e) => setField("documentType", e.target.value)}
                  className="w-full border rounded-lg p-3 bg-white"
                >
                  <option value="">Seleccionar</option>
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {touched.documentType && errors.documentType && (
                  <p className="text-red-500 text-sm">{errors.documentType}</p>
                )}
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-medium mb-1">Número de documento</label>
                <input
                  type="text"
                  placeholder="Número"
                  value={form.documentNumber}
                  onBlur={() => setFieldTouched("documentNumber")}
                  onChange={(e) => handleDocumentNumberChange(e.target.value)}
                  maxLength={getMaxLength()} // previene exceso
                  className="w-full border rounded-lg p-3"
                />
                {touched.documentNumber && errors.documentNumber && (
                  <p className="text-red-500 text-sm">{errors.documentNumber}</p>
                )}
              </div>

              {/* Estado — fijado en ACTIVE */}
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={form.status}
                  disabled // NO SE PUEDE CAMBIAR
                  className="w-full border rounded-lg p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Correo */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Correo</label>
                <input
                  type="email"
                  placeholder="example@empresa.com"
                  value={form.email}
                  onBlur={() => setFieldTouched("email")}
                  onChange={(e) => setField("email", e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
                {touched.email && errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input
                  type="password"
                  placeholder="********"
                  value={form.password}
                  onBlur={() => setFieldTouched("password")}
                  onChange={(e) => setField("password", e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
                {touched.password && errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  placeholder="********"
                  value={form.confirmPassword}
                  onBlur={() => setFieldTouched("confirmPassword")}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex justify-end gap-4 mt-8">
              <ButtonGeneric
                variant="secondary"
                onClick={() => navigate("/administradores")}
              >
                Cancelar
              </ButtonGeneric>

              <ButtonGeneric onClick={handleSaveWarning}>
                Guardar
              </ButtonGeneric>
            </div>
          </div>
        </div>
      </div>

      {/* MODALES */}
      <ModalWarning
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <ModalCheck
        isOpen={successOpen}
        message="Administrador registrado exitosamente"
      />
    </div>
  );
}

export default CreateAdmin;
