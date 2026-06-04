import type { Match, Team } from "@/lib/types";
import { computeStandings } from "@/lib/standings";
import { Flag } from "@/components/ui/Flag";
import { cn } from "@/lib/utils";

/**
 * Tabla de posiciones de un grupo. Los 2 primeros (zona de clasificación)
 * se resaltan en verde.
 */
export function GroupTable({
  group,
  teams,
  matches,
}: {
  group: string;
  teams: Team[];
  matches: Match[];
}) {
  const rows = computeStandings(teams, matches);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pitch text-xs font-bold text-white">
          {group}
        </span>
        <span className="text-sm font-bold">Grupo {group}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase text-gray-400">
            <th className="px-3 py-1.5 text-left font-medium">Equipo</th>
            <th className="px-1 py-1.5 text-center font-medium">PJ</th>
            <th className="px-1 py-1.5 text-center font-medium">DG</th>
            <th className="px-2 py-1.5 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.team.id}
              className={cn(
                "border-t border-gray-50 dark:border-gray-800/50",
                i < 2 && "bg-pitch/5"
              )}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs text-gray-400">{i + 1}</span>
                  <Flag name={r.team.name} emoji={r.team.flag_emoji} size={22} />
                  <span className="line-clamp-1 font-medium">{r.team.name}</span>
                </div>
              </td>
              <td className="px-1 py-2 text-center tabular-nums text-gray-500">{r.played}</td>
              <td className="px-1 py-2 text-center tabular-nums text-gray-500">
                {r.gd > 0 ? `+${r.gd}` : r.gd}
              </td>
              <td className="px-2 py-2 text-center font-bold tabular-nums">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
