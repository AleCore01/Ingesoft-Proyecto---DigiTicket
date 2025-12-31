import { useEffect, useMemo, useState, useCallback, useRef } from "react";

/* Hook reutilizable para CREAR y EDITAR Local */

export function useLocalForm({
  id,
  service,
  initialLocal,
  defaults = {
    name: "",
    address: "",
    city: "",
    district: "",
    capacity: "",
    status: "",
    contactEmail: "",
  },
  validate,
  onLoaded,
  onSaved,
}) {
  const isEdit = Boolean(id);
  const mode = isEdit ? "edit" : "create";

  const [formData, setFormData] = useState(defaults);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(!!id && !initialLocal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const lastLoadedId = useRef(null);

  const setField = useCallback(
    (field) => (value) => {
      setFormData((s) => ({ ...s, [field]: value }));
    },
    []
  );

  const setFieldTouched = useCallback(
    (field, v = true) => {
      setTouched((t) => ({ ...t, [field]: v }));
    },
    []
  );

   // ------------------- Validación -------------------
  const errors = useMemo(() => {
    if (validate) return validate(formData);
    const loc = {};
    if (!formData.name) loc.name = "*Campo requerido";
    if (!formData.address) loc.address = "*Campo requerido";
    if (!formData.city) loc.city = "*Seleccione una ciudad";
    if (!formData.district) loc.district = "*Seleccione un distrito";
    if (!formData.capacity) loc.capacity = "*Campo requerido";
    if (mode === "edit" && !String(formData.status || "").trim()) {
      loc.status = "*Campo requerido";
    }
    // contactEmail es OPCIONAL; si se completa, valida formato básico
    if (formData.contactEmail) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(formData.contactEmail).trim()
      );
      if (!emailOk) loc.contactEmail = "Correo inválido";
    }
    return loc;
  }, [formData, validate,mode]);

  // ------------------- Load (local) ------------------
  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    (async () => {
      if (!isEdit) return; // create: no cargar
      if (lastLoadedId.current === id) return; 
      lastLoadedId.current = id;

      setLoading(true);
      try {
        const data = initialLocal
          ? initialLocal
          : (await (service?.getById ? service.getById(id, { signal: ac.signal }) : Promise.resolve(null)))?.data ?? null;

        if (!alive) return;

        if (data) {
          const next = {
            name: data.name ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            district: data.district ?? "",
            capacity: data.capacity ?? "",
            status: data.status ?? "ACTIVE",
            contactEmail: data.contactEmail ?? "",
          };
          setFormData(next);
          onLoaded?.(next);
        }
        setLoading(false);
      } catch (e) {
        if (!alive || e?.name === "AbortError") return;
        setError(e);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
      ac.abort();  
    };
  },  [isEdit, id, service, initialLocal, onLoaded]);

  // Marca todos como tocados (para validar antes de submit)
  const touchAll = useCallback(() => {
    setTouched({
      name: true,
      address: true,
      city: true,
      district: true,
      capacity: true,
      status: true,
      contactEmail: true,
    });
  }, []);

  /* submit(transformPayload?): Valida | Crea o actualiza */
  const submit = useCallback(
    async (transformPayload) => {
      touchAll();
      if (Object.keys(errors).length > 0) {
        return { ok: false, reason: "validation", errors };
      }

      setSaving(true);
      setError(null);
      let payload = {
        name: String(formData.name || "").trim(),
        address: String(formData.address || "").trim(),
        city: String(formData.city || "").trim(),
        district: String(formData.district || "").trim(),
        capacity: Number(formData.capacity), // ya validado > 0
        contactEmail: (String(formData.contactEmail || "").trim() || null),
        // status: en create se fuerza "ACTIVE"; en edit se respeta el del form
        status: mode === "create"
          ? "ACTIVE"
          : (String(formData.status || "").trim() || "ACTIVE"),
      };

      // Permitir transformación externa opcional
      if (typeof transformPayload === "function") {
        const maybe = transformPayload(formData, { mode });
        if (maybe && typeof maybe === "object") {
          payload = maybe;
        }
      }

      try {
        const saved =
          mode === "edit"
            ? await service.update(id, payload)
            : await service.create(payload);

        onSaved?.(saved, { mode });
        return { ok: true, data: saved };
      } catch (e) {
        console.error("Save error:", e);
        setError(e);
        return { ok: false, reason: "server", error: e };
      } finally {
        setSaving(false);
      }
    },
    [errors, formData, id, mode, onSaved, service, touchAll]
  );

  const hasChanges = useMemo(() => true, [formData]);

  return {
    mode,
    // state
    isEdit,
    formData,
    setFormData,
    touched,
    setTouched,
    errors,
    loading,
    saving,
    error,

    // helpers
    setField,
    setFieldTouched,

    // acción principal
    submit,

    // opcional
    hasChanges,
  };
}