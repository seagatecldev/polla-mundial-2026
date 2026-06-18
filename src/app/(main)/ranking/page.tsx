import { Leaderboard } from "@/components/Leaderboard";
import { MvpFecha } from "@/components/MvpFecha";
import { getCurrentUser, getLeaderboard } from "@/lib/data";
import { getFechaRanking, getRankMovement } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const [user, profiles, fechaRanking, movement] = await Promise.all([
    getCurrentUser(),
    getLeaderboard(),
    getFechaRanking(),
    getRankMovement(),
  ]);

  return (
    <div className="mx-auto animate-fade-in-up space-y-4 lg:max-w-3xl">
      <div>
        <h1 className="text-xl font-extrabold">Ranking global</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {profiles.length} {profiles.length === 1 ? "participante" : "participantes"} compitiendo.
        </p>
      </div>
      <MvpFecha data={fechaRanking} currentUserId={user?.id} />
      <Leaderboard profiles={profiles} currentUserId={user?.id} movement={movement} />
    </div>
  );
}
