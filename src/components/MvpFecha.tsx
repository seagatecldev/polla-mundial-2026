import { Avatar } from "@/components/ui/Avatar";
import type { FechaRanking } from "@/lib/stats";

/**
 * Tarjeta destacada del "MVP de la fecha": el que más puntos sumó en la última
 * jornada jugada, con el podio (top 3). Da una micro-victoria a quien no lidera
 * el global. Si aún no hay fechas terminadas, no se muestra.
 */
export function MvpFecha({ data, currentUserId }: { data: FechaRanking; currentUserId?: string }) {
  if (!data.fecha || data.entries.length === 0) return null;

  const mvp = data.entries[0];
  const podio = data.entries.slice(0, 3);

  return (
    <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
          🏅 MVP de la fecha
        </h2>
        <span className="text-xs font-semibold text-gray-400">{data.fecha.label}</span>
      </div>

      <div className="flex items-center gap-3">
        <Avatar name={mvp.profile.display_name} seed={mvp.profile.id} size="md" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-extrabold">
            {mvp.profile.display_name}
            {mvp.profile.id === currentUserId && <span className="ml-1 text-xs text-pitch">(tú)</span>}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Mejor de la jornada</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tabular-nums text-gold">+{mvp.puntos}</p>
          <p className="text-[10px] text-gray-400">pts hoy</p>
        </div>
      </div>

      {podio.length > 1 && (
        <ul className="mt-3 space-y-1 border-t border-gold/20 pt-2">
          {podio.slice(1).map((e, i) => (
            <li key={e.profile.id} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-center font-bold text-gray-400">{i + 2}</span>
              <span className="min-w-0 flex-1 line-clamp-1 text-gray-600 dark:text-gray-300">
                {e.profile.display_name}
                {e.profile.id === currentUserId && <span className="ml-1 text-pitch">(tú)</span>}
              </span>
              <span className="font-bold tabular-nums text-gray-500">+{e.puntos}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
