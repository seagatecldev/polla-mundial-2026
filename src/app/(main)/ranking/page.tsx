import { Leaderboard } from "@/components/Leaderboard";
import { getCurrentUser, getLeaderboard } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const [user, profiles] = await Promise.all([getCurrentUser(), getLeaderboard()]);

  return (
    <div className="mx-auto animate-fade-in-up space-y-4 lg:max-w-3xl">
      <div>
        <h1 className="text-xl font-extrabold">Ranking global</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {profiles.length} {profiles.length === 1 ? "participante" : "participantes"} compitiendo.
        </p>
      </div>
      <Leaderboard profiles={profiles} currentUserId={user?.id} />
    </div>
  );
}
