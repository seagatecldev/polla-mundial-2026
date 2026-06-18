import Link from "next/link";
import type { Profile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

function medal(rank: number): string | null {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
}

/**
 * Reordena SOLO para quien mira: mueve al visor al frente de su propio bloque de
 * empate por PUNTOS (mismo total_points). Es puramente visual y personalizado por
 * visor; no cambia puntos ni lo que ven los demás. Nunca lo adelanta por encima de
 * gente con más puntos. Sí puede adelantar a empatados en puntos que tengan más
 * exactos (el desempate real del juego), pero eso es solo cosmético para el visor.
 * Como la lista ya viene ordenada por puntos, los empatados son un bloque contiguo.
 */
function floatViewerInTieGroup(profiles: Profile[], currentUserId?: string): Profile[] {
  if (!currentUserId) return profiles;
  const idx = profiles.findIndex((p) => p.id === currentUserId);
  if (idx <= 0) return profiles; // no está, o ya es el primero

  const me = profiles[idx];
  // Inicio del bloque de empate del visor (por puntos).
  let start = idx;
  while (start > 0 && profiles[start - 1].total_points === me.total_points) {
    start--;
  }
  if (start === idx) return profiles; // ya es el primero de su bloque

  const reordered = profiles.slice();
  reordered.splice(idx, 1); // sacar al visor
  reordered.splice(start, 0, me); // insertarlo al frente del bloque
  return reordered;
}

/** Flecha de movimiento de puesto desde la fecha anterior (↑ subió, ↓ bajó, — igual). */
function MovementArrow({ delta }: { delta: number | undefined }) {
  if (delta === undefined) return null;
  if (delta > 0) {
    return <span className="text-[10px] font-bold tabular-nums text-green-600 dark:text-green-400">▲{delta}</span>;
  }
  if (delta < 0) {
    return <span className="text-[10px] font-bold tabular-nums text-flame">▼{-delta}</span>;
  }
  return <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>;
}

export function Leaderboard({
  profiles,
  currentUserId,
  compact = false,
  movement,
}: {
  profiles: Profile[];
  currentUserId?: string;
  compact?: boolean;
  movement?: Record<string, number>;
}) {
  if (profiles.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
        Aún no hay puntos. ¡Sé el primero en predecir!
      </p>
    );
  }

  const view = floatViewerInTieGroup(profiles, currentUserId);

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
      {view.map((p, i) => {
        const rank = i + 1;
        const isMe = p.id === currentUserId;
        return (
          <li key={p.id}>
            <Link
              href={`/perfil/${p.id}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-800/50",
                isMe && "bg-pitch/5 dark:bg-pitch/10"
              )}
            >
              <span className="flex w-7 flex-col items-center text-sm font-bold tabular-nums text-gray-500">
                <span>{medal(rank) ?? rank}</span>
                {!compact && movement && <MovementArrow delta={movement[p.id]} />}
              </span>
              <Avatar name={p.display_name} seed={p.id} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">
                  {p.display_name}
                  {isMe && <span className="ml-1 text-xs text-pitch">(tú)</span>}
                </p>
                {!compact && (
                  <p className="text-[11px] text-gray-400">
                    {p.exact_scores} exactos · {p.correct_results} aciertos
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold tabular-nums text-pitch dark:text-pitch-light">
                  {p.total_points}
                </p>
                <p className="text-[10px] text-gray-400">pts</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
