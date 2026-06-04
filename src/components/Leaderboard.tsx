import Link from "next/link";
import type { Profile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

function medal(rank: number): string | null {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
}

export function Leaderboard({
  profiles,
  currentUserId,
  compact = false,
}: {
  profiles: Profile[];
  currentUserId?: string;
  compact?: boolean;
}) {
  if (profiles.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
        Aún no hay puntos. ¡Sé el primero en predecir!
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
      {profiles.map((p, i) => {
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
              <span className="w-7 text-center text-sm font-bold tabular-nums text-gray-500">
                {medal(rank) ?? rank}
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
