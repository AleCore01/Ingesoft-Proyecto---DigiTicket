import React, { useMemo, useRef, useEffect, useCallback } from 'react'

/* ---- Helpers ---- */
const inputCls = (hasError) =>
  `w-full px-4 py-3 border rounded-xl 
  focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200 
  ${hasError ? 'border-red-500' : 'border-gray-300'}`

/* para mensaje de error */
const FieldError = ({ id, msg }) =>
  msg ? (
    <p id={id} className="mt-2 text-[9px] leading-4 text-red-600 font-bold">
      {msg}
    </p>
  ) : null

const hhmmToMinutes = (t) => {
  if (!t || !t.includes(':')) return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

const diffMinutes = (startHHMM, endHHMM) => {
  const s = hhmmToMinutes(startHHMM)
  const e = hhmmToMinutes(endHHMM)
  if (s == null || e == null) return null

  // Diferencia misma fecha; si termina “antes”, asumimos cruza medianoche (+24h)
  let d = e - s
  if (d < 0) d += 24 * 60
  return d
}

// Helper: File -> Base64 SIN el "data:image/...;base64,"
const fileToBase64NoPrefix = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = reader.result || ''
      const i = s.indexOf(',')
      resolve(i >= 0 ? s.slice(i + 1) : s)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function EventForm({
  form,
  setField,
  setFieldTouched,
  touched,
  errors, // estado/control
  // ---- selects / datos externos
  statuses = [],
  catsLoading = false,
  catsError = null,
  categoryOptions = [],
  locsLoading = false,
  locsError = null,
  locationOptions = [],
  selectedLocation = null,
  // acciones
  onSaveClick,
}) {
  const salesDateRef = useRef(null)
  const dateRef = useRef(null)

  const statusOptions = useMemo(() => {
    if (Array.isArray(statuses) && statuses.length > 0) return statuses
    return [
      { id: 'DRAFT', name: 'BORRADOR' },
      { id: 'PUBLISHED', name: 'PUBLICADO' },
      { id: 'CANCELED', name: 'CANCELADO' },
      { id: 'FINISHED', name: 'FINALIZADO' },
    ]
  }, [statuses])

  const handleSubmit = (eve) => {
    eve.preventDefault()
    setFieldTouched('title')
    setFieldTouched('description')
    setFieldTouched('status')
    setFieldTouched('startsAt')
    setFieldTouched('durationMin')
    setFieldTouched('eventCategoryId')
    setFieldTouched('locationId')
    setFieldTouched('salesStartAt')
    onSaveClick?.()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const base64 = await fileToBase64NoPrefix(file)
    setField('imageBase64')(base64) // guarda en tu estado del form
    setFieldTouched?.('imageBase64') // marca como tocado si usas validación
  }

  useEffect(() => {
    if (!form?.startsAt || !form?.endTime) return

    const d = diffMinutes(form.startsAt, form.endTime)
    if (d != null && d !== form.durationMin) {
      setField('durationMin')(d)
    }
  }, [form.startsAt, form.endTime, form.durationMin, setField]) // ✅ Agregadas todas las dependencias

  return (
    <form onSubmit={handleSubmit} className="text-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Nombre */}
        <div>
          <label className="px-2 font-semibold mb-2 block"> Nombre </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField('title')(e.target.value)}
            onBlur={() => setFieldTouched('title')}
            className={inputCls(touched.title && !!errors.title)}
          />
          <FieldError id="err-title" msg={touched.title && errors.title} />
        </div>

        {/* Categoría */}
        <div>
          <label className="px-2 font-semibold mb-2 block">Categoría</label>
          <select
            value={form.eventCategoryId}
            onChange={(e) => setField('eventCategoryId')(e.target.value)}
            onBlur={() => setFieldTouched('eventCategoryId')}
            disabled={catsLoading || !!catsError}
            className={inputCls(
              touched.eventCategoryId && !!errors.eventCategoryId
            )}
          >
            <option value="">
              {catsLoading 
                ? 'Cargando...' 
                : catsError 
                  ? 'Error al cargar categorías' 
                  : 'Selecciona una categoría'}
            </option>
            {(categoryOptions || []).map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError
            id="err-category"
            msg={
              catsError 
                ? 'No se pudieron cargar las categorías. Verifica tu conexión.' 
                : (touched.eventCategoryId && errors.eventCategoryId)
            }
          />
        </div>

        {/* Fecha inicio venta */}
        <div>
          <label className="px-2 font-semibold mb-2 block">
            Fecha inicio de venta
          </label>
          <div className="relative">
            <input
              ref={salesDateRef}
              type="date"
              value={form.salesStartAt ?? ''}
              onChange={(e) => setField('salesStartAt')(e.target.value)}
              className={
                inputCls(!!(touched.salesStartAt && errors.salesStartAt)) +
                ' pr-6'
              }
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-80"
              onClick={() =>
                salesDateRef.current?.showPicker
                  ? salesDateRef.current.showPicker()
                  : salesDateRef.current?.focus()
              }
            />
          </div>
          <FieldError
            id="err-salesStartAt"
            msg={touched.salesStartAt && errors.salesStartAt}
          />
        </div>

        {/* Fecha del evento */}
        <div>
          <label className="px-2 font-semibold mb-2 block">
            Fecha a realizarse
          </label>
          <div className="relative">
            <input
              ref={dateRef}
              type="date"
              value={form.date ?? ''}
              onChange={(e) => setField('date')(e.target.value)}
              onBlur={() => setFieldTouched('date')}
              className={inputCls(touched.date && !!errors.date) + ' pr-6'}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80"
              onClick={() =>
                dateRef.current?.showPicker
                  ? dateRef.current.showPicker()
                  : dateRef.current?.focus()
              }
            />
          </div>
          <FieldError id="err-date" msg={touched.date && errors.date} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="px-2 font-semibold mb-2 block">
              {' '}
              Hora inicio{' '}
            </label>
            <input
              type="time"
              value={form.startsAt}
              onChange={(e) => setField('startsAt')(e.target.value)}
              onBlur={() => setFieldTouched('startsAt')}
              className={inputCls(touched.startsAt && !!errors.startsAt)}
            />
            <FieldError
              id="err-startsAt"
              msg={touched.startsAt && errors.startsAt}
            />
          </div>
          <div className="flex flex-col">
            <label className="px-2 font-semibold mb-2 block"> Hora fin </label>
            <input
              type="time"
              value={form.endTime || ''}
              onChange={(e) => setField('endTime')(e.target.value)}
              onBlur={() => setFieldTouched('endTime')}
              className={inputCls(touched.endTime && !!errors.endTime)}
            />
            <FieldError
              id="err-endTime"
              msg={touched.endTime && errors.endTime}
            />
          </div>
        </div>

        {/* Duracion (solo lectura) */}
        <div>
          <label className="px-2 font-semibold mb-2 block">
            {' '}
            Duración (min){' '}
          </label>
          <input
            type="number"
            value={form.durationMin ?? '0'}
            readOnly
            className={`${inputCls(
              false
            )} bg-gray-200 text-gray border-gray-300 focus:ring-0 cursor-not-allowed`}
          />
        </div>

        {/* Local */}
        <div>
          <label className="px-2 font-semibold mb-2 block">Local</label>
          <select
            value={form.locationId}
            onChange={(e) => setField('locationId')(e.target.value)}
            onBlur={() => setFieldTouched('locationId')}
            disabled={locsLoading || !!locsError || locationOptions.length === 0}
            className={inputCls(touched.locationId && !!errors.locationId)}
          >
            <option value="">
              {locsLoading 
                ? 'Cargando...' 
                : locsError 
                  ? 'Error al cargar locales' 
                  : 'Selecciona un local'}
            </option>
            {locationOptions.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <FieldError
            id="err-location"
            msg={
              locsError 
                ? 'No se pudieron cargar los locales. Verifica tu conexión.' 
                : (touched.locationId && errors.locationId)
            }
          />
        </div>

        {/* Dirección (solo lectura) */}
        <div>
          <label className="px-2 font-semibold mb-2 block">Dirección</label>
          <input
            type="text"
            value={selectedLocation?.address ?? ''}
            readOnly
            className={`${inputCls(
              false
            )} bg-gray-200 text-gray border-gray-300 focus:ring-0 cursor-not-allowed`}
          />
        </div>

        {/* Capacidad (solo lectura) */}
        <div>
          <label className="px-2 font-semibold mb-2 block">Capacidad</label>
          <input
            type="text"
            value={selectedLocation?.capacity ?? ''}
            readOnly
            className={`${inputCls(
              false
            )} bg-gray-200 text-gray border-gray-300 focus:ring-0 cursor-not-allowed`}
          />
        </div>

        {/* Estado */}
        <div>
          <label className="px-2 font-semibold mb-2 block">Estado</label>
          <select
            value={form.status}
            onChange={(e) => setField('status')(e.target.value)}
            className={inputCls(false)}
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? s.id}
              </option>
            ))}
          </select>
        </div>

        {/* Imagen del evento */}
        <div className="md:col-span-3">
          <label className="px-2 font-semibold mb-2 block">Imagen del evento</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={inputCls(false)}
          />
          {/* Preview si ya hay imagen en el form (nueva o traída del back) */}
          {form?.imageBase64 && (
            <img
              alt="preview"
              className="mt-2 rounded-xl"
              style={{ maxWidth: 320, height: "auto" }}
              src={`data:image/jpeg;base64,${form.imageBase64}`}
            />
          )}
        </div>

        {/* Descripción */}
        <div className="md:col-span-3">
          <label className="px-2 font-semibold mb-2 block">Descripción</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setField('description')(e.target.value)}
            onBlur={() => setFieldTouched('description')}
            className={inputCls(touched.description && !!errors.description)}
          />
          <FieldError
            id="err-description"
            msg={touched.description && errors.description}
          />
        </div>
      </div>
    </form>
  )
}