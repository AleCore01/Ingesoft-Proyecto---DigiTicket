import { useEffect, useMemo, useRef, useState, useCallback } from "react";

function getAdministratorIdFromSession() {
  try {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      // Extraemos el 'id' que se guarda en useLoginForm.ts
      const id = user?.id; 
      return Number.isFinite(Number(id)) ? Number(id) : null;
    }
  } catch (e) {
    // Esto atraparía errores de JSON.parse si el valor no es JSON
    console.error("Error al obtener el ID del administrador de localStorage:", e);
  }
  return null;
}

/** "YYYY-MM-DD" + "HH:mm[:ss]" -> "YYYY-MM-DDTHH:mm:ss" */
function toIso(dateStr, timeStr = "00:00:00") {
  if (!dateStr) return null;
  const [hh = "00", mm = "00", ss = "00"] = (timeStr || "00:00:00").split(":");
  return `${dateStr}T${hh}:${mm}:${ss}`;
}

/** Combina <input type="date"> + <input type="time"> */
function toIsoFromDateTimeLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [hh = "00", mm = "00"] = timeStr.split(":");
  return `${dateStr}T${hh}:${mm}:00`;
}

function minutesBetween(startsAt, endTime) {
  if (!startsAt || !endTime) return null;
  const [sh, sm] = startsAt.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  const diff = e - s;
  return diff >= 0 ? diff : 1440 + diff; // soporta cruce de medianoche
}

// === Helpers HH:mm <-> minutos ===
function hhmmToMin(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minToHHMM(total) {
  if (total == null || Number.isNaN(total)) return "";
  const mod = ((total % 1440) + 1440) % 1440; // soporta cruce de medianoche
  const h = Math.floor(mod / 60);
  const m = mod % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function addHHMM(hhmm, minutesToAdd) {
  const base = hhmmToMin(hhmm);
  if (base == null) return "";
  const total = base + (Number(minutesToAdd) || 0);
  return minToHHMM(total);
}

export function useEventForm({
    id,
    service, 
    initialEvent,
    defaults = {
        title: "",
        description: "",
        status: "DRAFT",
        date: "",
        durationMin: "",
        startsAt: "",
        endTime: "",
        eventCategoryId: "",
        locationId: "",
        salesStartAt: "",
    },
    validate,
    onLoaded,
    onSaved,
}) {
    const isEdit = Boolean(id);
    const mode = isEdit ? "edit" : "create";

    const [form, setForm] = useState(defaults);
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(!!id && !initialEvent);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const lastLoadedId = useRef(null);

    const setField = useCallback(
        (field) => (value) => {
            setForm((s) => ({ ...s, [field]: value }));
        },
        []
    );

    const setFieldTouched = useCallback(
        (field, v = true) => {
        setTouched((t) => ({ ...t, [field]: v }));
        },
        []
    );

    // Definir touchAll ANTES de usarlo en submit
    const touchAll = useCallback(() => {
        setTouched({
            title: true,
            description: true,
            status: true,
            date: true,
            durationMin: true,
            startsAt: true,
            endTime: true,
            eventCategoryId: true,
            locationId: true,
            salesStartAt: true,
            imageBase64: true,
        });
    }, []);

    // ------------------- Validación -------------------
    const errors = useMemo(() => {
        if (typeof validate === "function") return validate(form, { mode });

        const e = {};
        if (!form.title) e.title = "*Campo requerido";
        if (!form.eventCategoryId) e.eventCategoryId = "*Seleccione una categoria";
        if (!form.locationId) e.locationId = "*Seleccione un local";
        if (!form.date) e.date = "*Campo requerido";
        if (!form.startsAt) e.startsAt = "*Campo requerido";
        if (!form.endTime) e.endTime = "*Campo requerido";
        if (!form.status) e.status = "*Campo requerido";
        if (!form.salesStartAt) e.salesStartAt = "*Campo requerido";
        if (!form.description) e.description = "*Campo requerido";

        if (form.salesStartAt && form.date && form.salesStartAt >= form.date) {
            e.salesStartAt = "La venta debe iniciar antes del día del evento.";
        }
        return e;
    }, [form, validate, mode]);

    // ------------------- Load (event) ------------------
    useEffect(() => {
        let alive = true;
        const ac = new AbortController(); 
        (async () => {
            if (!isEdit) return;
            if (lastLoadedId.current === id) return;
            lastLoadedId.current = id;

            setLoading(true);
            try {
                const data = initialEvent
                   ? (initialEvent?.data ?? initialEvent) 
                   : (await (service?.getById ? service.getById(id, { signal: ac.signal }) : Promise.resolve(null)))?.data ?? null;
                
                    if (!alive) return;

                if (data) {
                    const date = (data.startsAt ? String(data.startsAt).slice(0, 10) : "");
                    const startHHMM = (data.startsAt ? String(data.startsAt).slice(11, 16) : "");
                    const duration = data.durationMin ?? "";

                    const next = {
                        title: data.title ?? "",
                        description: data.description ?? "",
                        status: data.status ?? "DRAFT",
                        date: (data.startsAt ? String(data.startsAt).slice(0, 10) : ""),
                        startsAt: startHHMM,
                        endTime: data.endTime || addHHMM(startHHMM, duration),
                        durationMin: duration,
                        eventCategoryId: data.eventCategoryId ?? "",
                        locationId: data.locationId ?? "",
                        salesStartAt: data.salesStartAt ? String(data.salesStartAt).slice(0, 10) : "",
                        imageBase64: data.imageBase64 ?? "",
                    };
                    setForm(next);
                    onLoaded?.(next);
                }
                setLoading(false);
            } catch (err) {
            if (!alive || err?.name === "AbortError") return;
            setError(err);
            setLoading(false);
            }
        })();
        return () => {
            alive = false;
            ac.abort(); 
        };
    }, [isEdit, id, service, initialEvent, onLoaded]);   

    /* submit(transformPayload?): valida y hace create/update */
    const submit = useCallback(
        async (transformPayload) => {
            touchAll();
            if (Object.keys(errors).length > 0) {
                return { ok: false, reason: "validation", errors };
            }

            setSaving(true);
            setError(null);

            const adminId = getAdministratorIdFromSession();

            let payload = {
                title: form.title.trim(),
                description: form.description?.trim() ?? "",
                status: form.status,
                startsAt: toIsoFromDateTimeLocal(form.date, form.startsAt),
                durationMin: minutesBetween(form.startsAt, form.endTime),
                eventCategoryId: Number(form.eventCategoryId),
                locationId: Number(form.locationId),
                ...(form.salesStartAt ? { salesStartAt: toIso(form.salesStartAt, "00:00:00") } : {}),
                administratorId: adminId, // ideal: derivarlo del JWT
                ...(form.imageBase64 ? { imageBase64: form.imageBase64 } : {}),
            };

            if (typeof transformPayload === "function") {
                const maybe = transformPayload(form, { mode });
                if (maybe && typeof maybe === "object") payload = maybe;
            }

            try {
                const saved =
                    mode === "edit"
                        ? await service.update(id, payload)
                        : await service.create(payload);
                
                
                const entity = saved?.data ?? saved; // normaliza siempre a objeto de dominio
                onSaved?.(entity, { mode });
                return { ok: true, data: entity };
            } catch (e) {
                console.error("Save error:", e);
                setError(e);
                return { ok: false, reason: "server", error: e };
            } finally {
                setSaving(false);
            }
        },
        [errors, form, id, isEdit, service, onSaved, touchAll]
    );

    const hasChanges = useMemo(() => true, [form]);

    return {
        mode,

        isEdit,
        form,
        setForm,
        touched,
        setTouched,
        errors,
        loading,
        saving,
        error,

        setField,
        setFieldTouched,

        submit,

        hasChanges,
    };
}