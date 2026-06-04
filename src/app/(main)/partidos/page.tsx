import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { getCurrentUser, getMatches, getUserPredictionsMap } from "@/lib/data";
import { GROUPS, PHASE_LABELS, type Phase, type Prediction } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PHASE_TABS: { key: Phase; label: string }[] = [
  { key: "group", label: "Grupos" },
  { key: "round_of_32", label: "Dieciseisavos" },
  { key: "round_of_16", label: "Octavos" },
  { key: "quarter", label: "Cuartos" },
  { key: "semi", label: "Semis" },
  { key: "final", label: "Final" },
];

type SearchParams = { phase?: string; group?: string };

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const phase = (PHASE_TABS.find((p) => p.key === sp.phase)?.key ?? "group") as Phase;
  const group = phase === "group" && sp.group && GROUPS.includes(sp.group as any) ? sp.group : undefined;

  const user = await getCurrentUser();
  const [matches, predMap] = await Promise.all([
    getMatches({ phase, group }),
    user ? getUserPredictionsMap(user.id) : Promise.resolve({} as Record<number, Prediction>),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Partidos</h1>

      {/* Tabs de fase */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {PHASE_TABS.map((t) => (
          <Tab key={t.key} href={`/partidos?phase=${t.key}`} active={t.key === phase}>
            {t.label}
          </Tab>
        ))}
      </div>

      {/* Sub-tabs de grupo */}
      {phase === "group" && (
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          <Tab href="/partidos?phase=group" active={!group} small>
            Todos
          </Tab>
          {GROUPS.map((g) => (
            <Tab key={g} href={`/partidos?phase=group&group=${g}`} active={group === g} small>
              {g}
            </Tab>
          ))}
        </div>
      )}

      {/* Lista */}
      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} prediction={predMap[m.id] ?? null} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400 dark:border-gray-700">
          {phase === "group"
            ? "No hay partidos en este grupo todavía."
            : `Los partidos de ${PHASE_LABELS[phase]} se definirán según avance el torneo.`}
        </p>
      )}
    </div>
  );
}

function Tab({
  href,
  active,
  small = false,
  children,
}: {
  href: string;
  active: boolean;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full font-semibold transition",
        small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        active
          ? "bg-pitch text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:border-pitch/40 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800"
      )}
    >
      {children}
    </Link>
  );
}
