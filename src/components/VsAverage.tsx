import { cn } from "@/lib/utils";
import type { Averages } from "@/lib/stats";

/**
 * Comparativa "tú vs el promedio del equipo": el cerebro humano ama compararse.
 * Muestra el % de acierto y los puntos del usuario contra el promedio, con una
 * frase motivadora según si va por encima o por debajo.
 */
export function VsAverage({
  accuracy,
  points,
  averages,
}: {
  accuracy: number;
  points: number;
  averages: Averages;
}) {
  const porEncima = accuracy >= averages.avgAccuracy;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
        📊 Tú vs el equipo
      </h2>

      <Bar label="Tu acierto" value={accuracy} reference={averages.avgAccuracy} suffix="%" />
      <Bar label="Tus puntos" value={points} reference={averages.avgPoints} className="mt-3" />

      <p
        className={cn(
          "mt-3 rounded-lg px-3 py-2 text-center text-xs font-semibold",
          porEncima
            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "bg-pitch/5 text-gray-600 dark:bg-pitch/10 dark:text-gray-300"
        )}
      >
        {porEncima
          ? "¡Vas por encima del promedio del equipo! 🚀"
          : "Vas un poco bajo el promedio — ¡a remontar! 💪"}
      </p>
    </section>
  );
}

function Bar({
  label,
  value,
  reference,
  suffix = "",
  className,
}: {
  label: string;
  value: number;
  reference: number;
  suffix?: string;
  className?: string;
}) {
  const max = Math.max(value, reference, 1);
  const valPct = Math.round((value / max) * 100);
  const refPct = Math.round((reference / max) * 100);

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-gray-500">
          {value}
          {suffix} <span className="text-gray-300 dark:text-gray-600">· prom. {reference}{suffix}</span>
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full bg-pitch dark:bg-pitch-light" style={{ width: `${valPct}%` }} />
        {/* Marca del promedio */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-500"
          style={{ left: `${refPct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
