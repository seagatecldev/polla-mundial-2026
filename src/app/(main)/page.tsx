import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { Leaderboard } from "@/components/Leaderboard";
import { Flag } from "@/components/ui/Flag";
import {
  getCurrentUser,
  getLeaderboard,
  getTeams,
  getUpcomingMatches,
  getUserPredictionsMap,
} from "@/lib/data";
import { GROUPS, type Prediction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [upcoming, topProfiles, teams, predMap] = await Promise.all([
    getUpcomingMatches(3),
    getLeaderboard(5),
    getTeams(),
    user ? getUserPredictionsMap(user.id) : Promise.resolve({} as Record<number, Prediction>),
  ]);

  const teamsByGroup = GROUPS.map((g) => ({
    group: g,
    teams: teams.filter((t) => t.group_name === g),
  }));

  return (
    <div className="animate-fade-in-up space-y-7 lg:space-y-9">
      <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
        {/* Próximos partidos */}
        <section className="lg:col-span-2">
          <SectionHeader title="Próximos partidos" href="/partidos" />
          {upcoming.length > 0 ? (
            <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-1 xl:grid-cols-2">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} prediction={predMap[m.id] ?? null} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
              No hay partidos próximos por ahora.
            </p>
          )}
        </section>

        {/* Mini ranking */}
        <section className="mt-7 lg:mt-0">
          <SectionHeader title="Top 5 del ranking" href="/ranking" icon />
          <Leaderboard profiles={topProfiles} currentUserId={user?.id} compact />
        </section>
      </div>

      {/* Grupos */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
          Grupos
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {teamsByGroup.map(({ group, teams }) => (
            <Link
              key={group}
              href={`/partidos?group=${group}`}
              className="rounded-2xl border border-gray-200 bg-white p-3 transition hover:border-pitch/40 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-pitch text-[11px] font-bold text-white">
                  {group}
                </span>
                <span className="text-xs font-bold">Grupo {group}</span>
              </div>
              <ul className="space-y-1">
                {teams.map((t) => (
                  <li key={t.id} className="flex items-center gap-1.5 text-xs">
                    <Flag name={t.name} emoji={t.flag_emoji} size={18} />
                    <span className="line-clamp-1 text-gray-600 dark:text-gray-300">{t.name}</span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, href, icon }: { title: string; href: string; icon?: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gray-500">
        {icon && <Trophy size={15} className="text-gold" />}
        {title}
      </h2>
      <Link href={href} className="flex items-center text-xs font-semibold text-pitch hover:underline">
        Ver todo <ChevronRight size={14} />
      </Link>
    </div>
  );
}
