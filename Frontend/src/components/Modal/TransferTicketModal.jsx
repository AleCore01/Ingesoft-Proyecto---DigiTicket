import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';

const initialState = { email: '', reason: '' };

const TransferTicketModal = ({ ticket, isOpen, onClose, onSubmit, loading, error }) => {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (isOpen) {
      setForm(initialState);
    }
  }, [isOpen, ticket?.id]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(form.email.trim(), form.reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={20} />
        </button>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">Transferencia de ticket</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{ticket.eventTitle}</h2>
          <p className="text-sm text-gray-500">Zona {ticket.zoneName} · Código {ticket.ticketCode}</p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Correo del destinatario</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              placeholder="persona@correo.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              Mensaje (opcional)
              <span className="text-xs text-gray-400">Máx. 120 caracteres</span>
            </label>
            <textarea
              maxLength={120}
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              rows={3}
              placeholder="Ej. ¡Disfruta del concierto!"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-fuchsia-700 disabled:opacity-70"
            >
              <Send size={16} />
              {loading ? 'Enviando...' : 'Transferir ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferTicketModal;
