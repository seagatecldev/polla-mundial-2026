import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/stats";

/**
 * Grilla de logros coleccionables. Los desbloqueados van a color; los pendientes
 * en gris como "por desbloquear", para incentivar a seguir jugando. Arriba, un
 * chip con la racha de aciertos actual.
 */
export function BadgeGrid({ badges, racha }: { badges: Badge[]; racha: number }) {
  const conseguidos = badges.filter((b) => b.desbloqueado).length;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Logros</h2>
        <div className="flex items-center gap-2">
          {racha > 0 && (
            <span className="rounded-full bg-flame/10 px-2 py-0.5 text-xs font-bold text-flame">
              🔥 Racha {racha}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {conseguidos}/{badges.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {badges.map((b) => (
          <div
            key={b.id}
            title={b.desc}
            className={cn(
              "flex flex-col items-center rounded-xl border p-3 text-center transition",
              b.desbloqueado
                ? "border-gold/40 bg-gold/5"
                : "border-gray-200 bg-gray-50 opacity-60 grayscale dark:border-gray-800 dark:bg-gray-900"
            )}
          >
            <span className="text-2xl">{b.emoji}</span>
            <span className="mt-1 text-[11px] font-bold leading-tight">{b.nombre}</span>
            <span className="mt-0.5 text-[9px] leading-tight text-gray-400">
              {b.desbloqueado ? "¡Conseguido!" : "Por desbloquear"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
