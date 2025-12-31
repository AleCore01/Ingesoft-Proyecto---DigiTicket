import { useEffect, useMemo, useState } from 'react';
import SideBarMenu from '../components/Layout/SideBarMenu';
import TopBar from '../components/Layout/TopBar';
import { settingsService } from '../services/settingsService';
import { Loader2, Save } from 'lucide-react';
import ModalCheck from '../components/Modal/ModalCheck';
import ModalWarning from '../components/Modal/ModalWarning';

const defaultValues = {
  maxTicketsPerPurchase: '1',
  pointsToSolesRatio: '1',
  pointsExpirationDays: '30',
  maxTicketTransfers: '1',
  reservationHoldTtlMinutes: '15',
  passwordResetTokenTtlMinutes: '10',
};

const SystemSettingsPage = () => {
  const [values, setValues] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fields = useMemo(() => ([
    {
      key: 'maxTicketsPerPurchase',
      label: 'Máximo de tickets por compra',
      description: 'Límite global aplicado al carrito y validaciones de compra.',
      min: 1,
      step: 1,
    },
    {
      key: 'maxTicketTransfers',
      label: 'Máximo de transferencias por ticket',
      description: 'Cada entrada solo puede transferirse esta cantidad de veces.',
      min: 0,
      step: 1,
    },
    {
      key: 'pointsToSolesRatio',
      label: 'Ratio puntos a soles',
      description: 'Equivalencia de puntos de fidelidad (ej. 0.1 = S/0.10 por punto).',
      min: 0.01,
      step: 0.01,
      type: 'decimal',
    },
    {
      key: 'pointsExpirationDays',
      label: 'Días de expiración de puntos',
      description: 'Tiempo máximo antes de que los puntos acumulados caduquen.',
      min: 1,
      step: 1,
    },
    {
      key: 'reservationHoldTtlMinutes',
      label: 'Tiempo de reserva del carrito (min)',
      description: 'Minutos que dura una reserva antes de liberar los asientos.',
      min: 1,
      step: 1,
    },
    {
      key: 'passwordResetTokenTtlMinutes',
      label: 'Duración token reseteo de contraseña (min)',
      description: 'Tiempo disponible para usar el enlace de recuperación.',
      min: 1,
      step: 1,
    },
  ]), []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.get();
        setValues({
          ...defaultValues,
          ...Object.fromEntries(
            Object.entries(data || {}).map(([k, v]) => [k, v != null ? String(v) : ''])
          ),
        });
      } catch (error) {
        console.error('Error al cargar settings', error);
        setFeedback({ type: 'error', message: 'No se pudieron cargar las configuraciones.' });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateValue = (key, raw) => {
    setValues((prev) => ({
      ...prev,
      [key]: raw,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        maxTicketsPerPurchase: Number(values.maxTicketsPerPurchase),
        pointsToSolesRatio: Number(values.pointsToSolesRatio),
        pointsExpirationDays: Number(values.pointsExpirationDays),
        maxTicketTransfers: Number(values.maxTicketTransfers),
        reservationHoldTtlMinutes: Number(values.reservationHoldTtlMinutes),
        passwordResetTokenTtlMinutes: Number(values.passwordResetTokenTtlMinutes),
      };

      const updated = await settingsService.update(payload);
      setValues({
        ...defaultValues,
        ...Object.fromEntries(Object.entries(updated).map(([k, v]) => [k, v != null ? String(v) : ''])),
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error guardando settings', error);
      setErrorMessage(error?.message || 'No se pudieron guardar los cambios.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-backgroundGeneral">
      <SideBarMenu />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Configuración del sistema</h1>
              <p className="text-gray-600 mt-2">
                Ajusta los parámetros globales usados por compras, transferencias y fidelización.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="animate-spin w-6 h-6 mr-2" />
                  Cargando configuraciones...
                </div>
              ) : (
                <>
                  {fields.map((field) => (
                    <div key={field.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-semibold text-gray-800">{field.label}</label>
                          <p className="text-xs text-gray-500">{field.description}</p>
                        </div>
                      </div>
                      <input
                        type="number"
                        min={field.min}
                        step={field.step}
                        value={values[field.key] ?? ''}
                        onChange={(e) => updateValue(field.key, e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple/60"
                      />
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-purple px-6 py-3 font-semibold text-white shadow-md transition hover:bg-purple/90 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      <ModalCheck
        isOpen={showSuccessModal}
        message="Configuraciones guardadas correctamente"
        onClose={() => setShowSuccessModal(false)}
      />

      <ModalWarning
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title="Error al guardar"
        message={errorMessage}
      />
    </div>
  );
};

export default SystemSettingsPage;
