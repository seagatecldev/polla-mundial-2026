import { notFound } from "next/navigation";
import { PaginatedMatches } from "@/components/PaginatedMatches";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeGrid } from "@/components/BadgeGrid";
import { VsAverage } from "@/components/VsAverage";
import { getProfile, getUserPredictionsWithMatch } from "@/lib/data";
import { getUserBadges, getRacha, getAverages } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profile = await getProfile(userId);
  if (!profile) notFound();

  const [predictions, badges, racha, averages] = await Promise.all([
    getUserPredictionsWithMatch(userId),
    getUserBadges(userId),
    getRacha(userId),
    getAverages(),
  ]);
  // Historial: solo partidos jugados, ordenados del MÁS RECIENTE al más antiguo
  // (por fecha del partido, no por cuándo predijo).
  const finished = predictions
    .filter((p) => p.match?.status === "finished" && p.points_earned != null)
    .sort((a, b) => (a.match!.match_date < b.match!.match_date ? 1 : -1));
  const finishedMatches = finished.map((p) => p.match!);
  const finishedPredMap = Object.fromEntries(finished.map((p) => [p.match!.id, p]));

  const accuracy =
    profile.predictions_count > 0
      ? Math.round((profile.correct_results / profile.predictions_count) * 100)
      : 0;

  return (
    <div className="mx-auto animate-fade-in-up space-y-5 lg:max-w-4xl">
      {/* Cabecera de perfil */}
      <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <Avatar name={profile.display_name} seed={profile.id} size="lg" />
        <h1 className="mt-3 text-lg font-extrabold">{profile.display_name}</h1>
        <p className="text-xs text-gray-400">
          Miembro desde{" "}
          {new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(
            new Date(profile.created_at)
          )}
        </p>

        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          <Stat label="Puntos" value={profile.total_points} highlight />
          <Stat label="Predicciones" value={profile.predictions_count} />
          <Stat label="% Aciertos" value={`${accuracy}%`} />
        </div>
        <div className="mt-2 grid w-full grid-cols-2 gap-2">
          <Stat label="Marcadores exactos" value={profile.exact_scores} />
          <Stat label="Resultados acertados" value={profile.correct_results} />
        </div>
      </div>

      {/* Logros + racha */}
      <BadgeGrid badges={badges} racha={racha} />

      {/* Comparativa contra el promedio del equipo */}
      {profile.predictions_count > 0 && (
        <VsAverage accuracy={accuracy} points={profile.total_points} averages={averages} />
      )}

      {/* Predicciones de partidos terminados */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
          Predicciones jugadas
        </h2>
        {finished.length > 0 ? (
          <PaginatedMatches
            matches={finishedMatches}
            predMap={finishedPredMap}
            canPredict={false}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
            Todavía no tiene partidos jugados.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-2 text-center ${
        highlight
          ? "border-pitch/30 bg-pitch/5"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <p
        className={`text-base font-extrabold tabular-nums ${
          highlight ? "text-pitch dark:text-pitch-light" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] leading-tight text-gray-400">{label}</p>
    </div>
  );
}
