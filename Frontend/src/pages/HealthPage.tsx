import { useEffect, useMemo, useRef, useState } from "react";
import { healthService } from "../services/health.service";

type Status = "ok" | "down" | "unknown";

type Sample = {
  at: Date;
  status: Status;
  ms: number;
  message: string;
};

const DEFAULT_EVERY_MS = 10_000; // 10s

export default function HealthPage() {
  const [status, setStatus] = useState<Status>("unknown");
  const [message, setMessage] = useState<string>("—");
  const [latency, setLatency] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);
  const [everyMs, setEveryMs] = useState<number>(DEFAULT_EVERY_MS);
  const [history, setHistory] = useState<Sample[]>([]);

  const timerRef = useRef<number | null>(null);

  const colorClasses = useMemo(() => {
    switch (status) {
      case "ok":
        return "bg-green-50 text-green-700 border-green-200";
      case "down":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }, [status]);

  const runCheck = async () => {
    const t0 = performance.now();
    try {
      const text = await healthService.ping(); // GET /api/hello
      const ms = Math.round(performance.now() - t0);
      setStatus("ok");
      setLatency(ms);
      setMessage(text || "OK");
      setHistory((h) =>
        [{ at: new Date(), status: "ok" as Status, ms, message: text || "OK" }, ...h].slice(0, 10)
        );
    } catch (err: any) {
      const ms = Math.round(performance.now() - t0);
      setStatus("down");
      setLatency(ms);
      setMessage(err?.message || "No reachable");
      setHistory((h) =>
        [{ at: new Date(), status: "down" as Status, ms, message: err?.message || "Error" }, ...h].slice(0, 10)
        );
    }
  };

  useEffect(() => {
    // primer chequeo inmediato
    runCheck();

    if (!running) return;
    // limpia intervalo anterior
    if (timerRef.current) clearInterval(timerRef.current);

    // programa polling
    timerRef.current = window.setInterval(runCheck, Math.max(2000, everyMs)); // mínimo 2s
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, everyMs]);

  return (
    <div className="min-h-screen bg-white font-poppins flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="rounded-3xl shadow-card overflow-hidden">
          {/* Header degradado */}
          <div className="bg-superticket-gradient p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-extrabold">Health Monitor</h1>
            <p className="text-white/90 mt-1 text-sm">
              Comprobando <code className="px-1 py-0.5 bg-white/20 rounded">/api/hello</code> cada{" "}
              {Math.round(everyMs / 1000)}s
            </p>
          </div>

          {/* Body */}
          <div className="p-6 bg-white">
            {/* Estado actual */}
            <div className={`border rounded-xl p-4 flex items-center justify-between ${colorClasses}`}>
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: status === "ok" ? "#16a34a" : status === "down" ? "#dc2626" : "#9ca3af",
                  }}
                />
                <div>
                  <div className="text-sm">Estado actual</div>
                  <div className="font-semibold text-base capitalize">{status}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">Latencia</div>
                <div className="font-semibold">{latency} ms</div>
              </div>
            </div>

            {/* Mensaje */}
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">Último mensaje</div>
              <pre className="whitespace-pre-wrap break-words bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
                {message}
              </pre>
            </div>

            {/* Controles */}
            <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <button
                onClick={runCheck}
                className="px-4 py-2 rounded-xl bg-superticket-gradient text-white font-semibold hover:opacity-90"
              >
                Chequear ahora
              </button>

              <button
                onClick={() => setRunning((r) => !r)}
                className="px-4 py-2 rounded-xl border font-semibold text-gray-700 hover:bg-gray-50"
              >
                {running ? "Pausar" : "Reanudar"}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-gray-600">Intervalo:</label>
                <input
                  type="number"
                  min={2}
                  step={1}
                  value={Math.round(everyMs / 1000)}
                  onChange={(e) => setEveryMs(Math.max(2000, Number(e.target.value || 10) * 1000))}
                  className="w-20 px-3 py-2 border rounded-xl"
                />
                <span className="text-sm text-gray-600">seg</span>
              </div>
            </div>

            {/* Historial */}
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">Últimos 10 chequeos</div>
              <div className="grid grid-cols-1 gap-2">
                {history.length === 0 ? (
                  <div className="text-sm text-gray-500">Sin datos aún…</div>
                ) : (
                  history.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: s.status === "ok" ? "#16a34a" : s.status === "down" ? "#dc2626" : "#9ca3af",
                          }}
                        />
                        <span className="font-medium capitalize">{s.status}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{s.ms} ms</span>
                      </div>
                      <div className="text-gray-500">{s.at.toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t text-xs text-gray-500">
            Backend: <code>{(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")}/hello</code>
          </div>
        </div>
      </div>
    </div>
  );
}
