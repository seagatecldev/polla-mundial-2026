import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchCard } from "@/components/MatchCard";
import {
  getCurrentUser,
  getProfile,
  getUserPredictionsWithMatch,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Prediction } from "@/lib/types";

export const dynamic = "force-dynamic";

type Filter = "todas" | "pendientes" | "acertadas" | "falladas";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "pendientes", label: "Pendientes" },
  { key: "acertadas", label: "Acertadas" },
  { key: "falladas", label: "Falladas" },
];

function matchesFilter(p: Prediction, f: Filter): boolean {
  const finished = p.match?.status === "finished" && p.points_earned != null;
  switch (f) {
    case "pendientes":
      return !finished;
    case "acertadas":
      return finished && (p.points_earned ?? 0) > 0;
    case "falladas":
      return finished && p.points_earned === 0;
    default:
      return true;
  }
}

export default async function MisPrediccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.filtro)?.key ?? "todas") as Filter;

  const [profile, predictions] = await Promise.all([
    getProfile(user.id),
    getUserPredictionsWithMatch(user.id),
  ]);

  const visible = predictions.filter((p) => matchesFilter(p, filter));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Mis predicciones</h1>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Puntos" value={profile?.total_points ?? 0} highlight />
        <Stat label="Predichos" value={predictions.length} />
        <Stat label="Aciertos" value={profile?.correct_results ?? 0} />
        <Stat label="Exactos" value={profile?.exact_scores ?? 0} />
      </div>

      {/* Filtros */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/mis-predicciones?filtro=${f.key}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
              f.key === filter
                ? "bg-pitch text-white"
                : "bg-white text-gray-600 border border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {visible.length > 0 ? (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 xl:grid-cols-3">
          {visible.map((p) =>
            p.match ? (
              <MatchCard key={p.id} match={p.match} prediction={p} />
            ) : null
          )}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400 dark:border-gray-700">
          {predictions.length === 0 ? (
            <>
              Aún no has predicho ningún partido.{" "}
              <Link href="/partidos" className="font-semibold text-pitch hover:underline">
                Empieza ahora
              </Link>
              .
            </>
          ) : (
            "No hay predicciones con este filtro."
          )}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-2 text-center",
        highlight
          ? "border-pitch/30 bg-pitch/5"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      )}
    >
      <p
        className={cn(
          "text-lg font-extrabold tabular-nums",
          highlight && "text-pitch dark:text-pitch-light"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
