import React, { useMemo } from "react";
import ButtonGeneric from "../Buttons/ButtonGeneric";

const inputCls = (hasError) =>
    `w-full px-4 py-3 border rounded-xl 
    focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200 
    ${ hasError ? "border-red-500" : "border-gray-300"}`;

/* para mensaje de error */
const FieldError = ({ id, msg }) =>
msg ? (
    <p id={id} className="mt-2 text-[9px] leading-4 text-red-600 font-bold">
    {msg}
    </p>
) : null;

export default function LocalForm({
  formData, setField, setFieldTouched, touched, errors, // estado/control
  // selects 
  statuses = [], statusesLoading = false,
  cityOptions = [], districtOptions = [],
  citiesLoading = false, districtsLoading = false,
  lockStatus = false,
  // acciones
  onSaveClick,      
  onCancel,         
  saving = false, 

  onCityChange, 
}) {

    const statusOptions = useMemo(() => {
        if (Array.isArray(statuses) && statuses.length > 0) return statuses;
        return [
        { id: "ACTIVE", name: "ACTIVE" },
        { id: "INACTIVE", name: "INACTIVE" },
        ];
    }, [statuses]);

    const handleSubmit = (loc) => {
        loc.preventDefault();
        setFieldTouched("name");
        setFieldTouched("address");
        setFieldTouched("city");
        setFieldTouched("district");
        setFieldTouched("capacity");
        setFieldTouched("status");
        setFieldTouched("contactEmail");
        onSaveClick?.();
    };

    const canChooseDistrict = !!formData.cityId && !districtsLoading;

    return(
        <form onSubmit={handleSubmit} className="text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Nombre */}
                <div>
                    <label className="px-2 font-semibold mb-2 block"> Nombre </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(loc) => setField("name")(loc.target.value)}
                        onBlur={() => setFieldTouched("name")}
                        className={inputCls(touched.name && !!errors.name)}
                    />
                    <FieldError id="err-name" msg={touched.name && errors.name} />
                </div>

                {/* Dirección */}
                <div>
                    <label className="px-2 font-semibold mb-2 block"> Dirección</label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(loc) => setField("address")(loc.target.value)}
                        onBlur={() => setFieldTouched("address")}
                        className={inputCls(touched.address && !!errors.address)}
                    />
                    <FieldError id="err-address" msg={touched.address && errors.address} />
                </div>

                {/* Ciudad */}
                <div>
                    <label className="px-2 font-semibold mb-2 block"> Ciudad </label>
                    <select
                        value={formData.cityId || ""}
                        onChange={(loc) => {
                            const cityId = loc.target.value;
                            const cityName = loc.target.options[loc.target.selectedIndex]?.text ?? "";
                            
                            setField("cityId")(cityId);
                            setField("city")(cityName); 
                            setFieldTouched("city");

                            setField("districtId")(""); // limpiar distrito actual               
                            setField("district")("");
                            onCityChange?.(cityId); // disparar carga de distritos
                        }}
                        onBlur={() => setFieldTouched("city")}
                        className={inputCls(touched.city && !!errors.city)}
                    >
                         <option value="">
                            {citiesLoading ? "Cargando..." : "Seleccione una ciudad"}
                        </option>
                        {!citiesLoading &&
                            (cityOptions || []).map((c) => (
                            <option key={String(c.id)} value={String(c.id)}>
                                {c.name}
                            </option>
                            ))
                        }
                    </select>
                    <FieldError id="err-city" msg={touched.city && errors.city} />
                </div>

                {/* Distrito */}
                <div>
                    <label className="px-2 font-semibold mb-2 block">Distrito</label>
                    <select
                        value={formData.districtId}
                        onChange={(loc) => {
                            const districtId = loc.target.value;
                            const districtName = loc.target.options[loc.target.selectedIndex]?.text ?? "";

                            setField("districtId")(districtId); // para estado interno
                            setField("district")(districtName); // NOMBRE visible y el que se guardará en BD
                            setFieldTouched("district");
                        }}
                        onBlur={() => setFieldTouched("district")}
                        disabled={!canChooseDistrict}
                        className={inputCls(touched.district && !!errors.district) + (!canChooseDistrict ? " bg-gray-200 cursor-not-allowed" : "")}
                    >
                        <option value="">
                            {districtsLoading ? "Cargando..." : "Seleccione un distrito"}
                        </option>
                        {!districtsLoading &&
                            (districtOptions || []).map((d) => (
                            <option key={String(d.id)} value={String(d.id)}>
                                {d.name}
                            </option>
                            ))
                        }
                    </select>
                    <FieldError id="err-district" msg={touched.district && errors.district} />
                </div>

                {/* Capacidad */}
                <div>
                    <label className="px-2 font-semibold mb-2 block">Capacidad</label>
                    <input
                        type="number"
                        value={formData.capacity}
                        onChange={(loc) => setField("capacity")(loc.target.value)}
                        onBlur={() => setFieldTouched("capacity")}
                        className={inputCls(touched.capacity && !!errors.capacity)}
                    />
                    <FieldError id="err-capacity" msg={touched.capacity && errors.capacity} />
                </div>

                {/* Estado */}
                <div>
                    <label className="px-2 font-semibold mb-2 block">Estado</label>
                    <select
                        value={formData.status}
                        onChange={(loc) => setField("status")(loc.target.value)}
                        disabled={lockStatus}
                        className={
                            inputCls(touched.status && !!errors.status) +
                            (lockStatus
                                ? " bg-gray-200 text-black border-gray-300 focus:ring-0 cursor-not-allowed"
                                : "")
                    }
                    >
                    {statusesLoading && <option value="">Cargando...</option>}
                    {!statusesLoading &&
                        statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name ?? s.id}
                        </option>
                        ))}
                    </select>
                    <FieldError id="err-status" msg={touched.status && errors.status} />
                </div>

                {/* Correo del contacto */}
                <div>
                    <label className="px-2 font-semibold mb-2 block">Correo del contacto</label>
                    <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(loc) => setField("contactEmail")(loc.target.value)}
                        onBlur={() => setFieldTouched("contactEmail")}
                        className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-purple"
                        placeholder="ej: admin@empresa.com"
                    />
                    <FieldError id="err-contactEmail" msg={touched.contactEmail && errors.contactEmail}/>
                </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
                <ButtonGeneric
                    type="submit"  
                    onClick={undefined}
                    loading={saving}
                    disabled={saving}
                    className="w-full sm:w-auto"
                    variant="default">
                    Guardar
                </ButtonGeneric>

                <ButtonGeneric
                    type="button"  
                    onClick={onCancel}
                    className="w-full sm:w-auto"
                    variant="cancel">
                    Cancelar
                </ButtonGeneric>
            </div>
        </form>
    );
}  