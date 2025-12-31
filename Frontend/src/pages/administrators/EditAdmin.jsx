import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import DateBadge from "../../components/Badges/DateBadge";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";

import ModalWarning from "../../components/Modal/ModalWarning";
import ModalCheck from "../../components/Modal/ModalCheck";
import ContentPreLoader from "../../components/Layout/ContentPreloader";

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

function EditAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    documentType: "",
    documentNumber: "",
    email: "",
    status: "ACTIVE",
    role: "ADMIN",
  });

  const [loading, setLoading] = useState(true);
  const [touched, setTouched] = useState({});

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setFieldTouched = (f) =>
    setTouched((prev) => ({ ...prev, [f]: true }));

  // VALIDACIONES
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Nombre requerido";
  if (!form.lastName.trim()) errors.lastName = "Apellido requerido";
  if (!form.documentType) errors.documentType = "Seleccione tipo de documento";
  if (!form.documentNumber.trim()) errors.documentNumber = "Número requerido";
  if (!form.email.trim()) errors.email = "Correo requerido";

  // ==============================
  // FETCH ADMIN DATA
  // ==============================
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        setLoading(true);
        const response = await adminService.getById(id);

        const data = response?.data || response;

        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          email: data.email,
          status: data.status,
          role: data.role || "ADMIN",
        });
      } catch (err) {
        console.error("Error cargando admin:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [id]);

  // MODALES
  const [warningOpen, setWarningOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSaveWarning = () => {
    Object.keys(form).forEach((f) => setFieldTouched(f));
    if (Object.keys(errors).length > 0) return;
    setWarningOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setWarningOpen(false);

      await adminService.update(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        documentType: form.documentType,
        documentNumber: form.documentNumber.trim(),
        email: form.email.trim(),
        status: form.status,
        role: form.role,
      });

      setSuccessOpen(true);
      setTimeout(() => {
        setSuccessOpen(false);
        navigate("/administradores");
      }, 1800);
    } catch (err) {
      console.error("Error actualizando admin:", err);
    }
  };

  const getMaxLength = () => {
    if (form.documentType === "DNI") return 8;
    if (form.documentType === "PASSPORT") return 9;
    if (form.documentType === "CE") return 20;
    return 100;
  };

  // ==============================
  // LOADING (igual estilo que EditLocal)
  // ==============================
  if (loading) {
    return (
      <div className="flex h-screen">
        <SideBarMenu />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-8 bg-backgroundGeneral flex items-center justify-center">
            <ContentPreLoader loading={loading} text="Cargando administrador..." />
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // RENDER FORM
  // ==============================
  return (
    <div className="flex min-h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-2">
              Editar administrador
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
                  value={form.lastName}
                  onBlur={() => setFieldTouched("lastName")}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
                {touched.lastName && errors.lastName && (
                  <p className="text-red-500 text-sm">{errors.lastName}</p>
                )}
              </div>

              {/* Tipo Documento */}
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

              {/* Número documento */}
              <div>
                <label className="block text-sm font-medium mb-1">Número de documento</label>
                <input
                  type="text"
                  maxLength={getMaxLength()}
                  value={form.documentNumber}
                  onBlur={() => setFieldTouched("documentNumber")}
                  onChange={(e) =>
                    setField("documentNumber", e.target.value.slice(0, getMaxLength()))
                  }
                  className="w-full border rounded-lg p-3"
                />
                {touched.documentNumber && errors.documentNumber && (
                  <p className="text-red-500 text-sm">{errors.documentNumber}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className="w-full border rounded-lg p-3 bg-white"
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
                  value={form.email}
                  onBlur={() => setFieldTouched("email")}
                  onChange={(e) => setField("email", e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
                {touched.email && errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
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

      <ModalWarning
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <ModalCheck
        isOpen={successOpen}
        message="Administrador actualizado exitosamente"
      />
    </div>
  );
}

export default EditAdmin;
