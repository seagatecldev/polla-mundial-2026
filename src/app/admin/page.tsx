import { AdminMatchRow } from "@/components/admin/AdminMatchRow";
import { GenerateBracketPanel } from "@/components/admin/GenerateBracketPanel";
import { parseEligibleGroups } from "@/lib/bracket";
import { getMatches, getTeams } from "@/lib/data";
import { computeQualification } from "@/lib/qualification";
import { GROUPS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [teams, groupMatches, upcoming, live, finished, r32] = await Promise.all([
    getTeams(),
    getMatches({ phase: "group" }),
    getMatches({ status: "upcoming" }),
    getMatches({ status: "live" }),
    getMatches({ status: "finished" }),
    getMatches({ phase: "round_of_32" }),
  ]);

  // Solo se pueden cargar resultados de partidos con ambos equipos definidos.
  const hasTeams = (m: { home_team_id: number | null; away_team_id: number | null }) =>
    m.home_team_id != null && m.away_team_id != null;

  const pending = [...live, ...upcoming].filter(hasTeams);
  const finishedWithTeams = finished.filter(hasTeams);

  // Datos de clasificación para el panel de generación del cuadro.
  const q = computeQualification(teams, groupMatches);
  const alreadyGenerated = r32.some((m) => m.home_team_id != null);
  const winners = GROUPS.map((g) => ({ group: g, team: q.winners[g] ?? null }));
  const runners = GROUPS.map((g) => ({ group: g, team: q.runners[g] ?? null }));
  const thirds = q.thirds.map((t) => ({ group: t.group, team: t.team, qualified: t.qualified }));

  // Llaves de tercero (R32 con visitante "3[...]"), con su rival y grupos elegibles.
  const slots = r32
    .map((m) => ({
      code: m.bracket_code ?? "",
      rival: m.home_source ?? "",
      eligible: parseEligibleGroups(m.away_source) ?? [],
    }))
    .filter((s) => s.eligible.length > 0)
    .sort((a, b) => Number(a.code) - Number(b.code));

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Ingresa el marcador final de cada partido. Al guardar se recalculan automáticamente
        los puntos de todas las predicciones y el ranking.
      </p>

      <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
        {/* Generación del cuadro (columna lateral fija en escritorio) */}
        <div className="lg:sticky lg:top-24">
          <GenerateBracketPanel
            complete={q.complete}
            alreadyGenerated={alreadyGenerated}
            winners={winners}
            runners={runners}
            thirds={thirds}
            slots={slots}
            warnings={q.warnings}
          />
        </div>

        {/* Partidos */}
        <div className="mt-6 space-y-6 lg:col-span-2 lg:mt-0">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
              Por jugar / en vivo ({pending.length})
            </h2>
            {pending.length > 0 ? (
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                {pending.map((m) => (
                  <AdminMatchRow key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No hay partidos pendientes con equipos definidos.
              </p>
            )}
          </section>

          {finishedWithTeams.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                Finalizados ({finishedWithTeams.length}) — editar si hace falta
              </h2>
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                {finishedWithTeams.map((m) => (
                  <AdminMatchRow key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
