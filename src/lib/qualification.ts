import type { Match, Team } from "@/lib/types";
import { GROUPS } from "@/lib/types";
import { computeStandings, type StandingRow } from "@/lib/standings";

// Cálculo de clasificación de fase de grupos a eliminatorias.
// Reutiliza computeStandings (misma lógica/orden que la tabla visible).

export type ThirdEntry = {
  group: string;
  team: Team;
  row: StandingRow;
  qualified: boolean; // entre los 8 mejores
};

export type QualificationResult = {
  /** group_name -> equipo 1º */
  winners: Record<string, Team | null>;
  /** group_name -> equipo 2º */
  runners: Record<string, Team | null>;
  /** Los 12 terceros ordenados (mejor primero); los 8 primeros con qualified=true */
  thirds: ThirdEntry[];
  /** true si TODOS los partidos de grupos están finalizados */
  complete: boolean;
  /** Avisos de empates no resueltos automáticamente (para decisión manual) */
  warnings: string[];
};

/** Clave de comparación de un tercero: [puntos, dif. gol, goles a favor]. */
function thirdKey(r: StandingRow): [number, number, number] {
  return [r.points, r.gd, r.gf];
}

function sameKey(a: StandingRow, b: StandingRow): boolean {
  const ka = thirdKey(a);
  const kb = thirdKey(b);
  return ka[0] === kb[0] && ka[1] === kb[1] && ka[2] === kb[2];
}

/**
 * Calcula winners, runners y los 8 mejores terceros a partir de todos los
 * equipos y los partidos de fase de grupos.
 */
export function computeQualification(teams: Team[], groupMatches: Match[]): QualificationResult {
  const winners: Record<string, Team | null> = {};
  const runners: Record<string, Team | null> = {};
  const thirdRows: { group: string; team: Team; row: StandingRow }[] = [];
  const warnings: string[] = [];

  for (const g of GROUPS) {
    const groupTeams = teams.filter((t) => t.group_name === g);
    const matches = groupMatches.filter((m) => m.group_name === g);
    const table = computeStandings(groupTeams, matches);

    winners[g] = table[0]?.team ?? null;
    runners[g] = table[1]?.team ?? null;
    if (table[2]) thirdRows.push({ group: g, team: table[2].team, row: table[2] });

    // Empate sin resolver en puestos 1-2-3 (mismo pts/DG/GF)
    if (table[0] && table[1] && sameKey(table[0], table[1])) {
      warnings.push(`Grupo ${g}: 1º y 2º empatados (decidir 1º/2º).`);
    }
    if (table[1] && table[2] && sameKey(table[1], table[2])) {
      warnings.push(`Grupo ${g}: 2º y 3º empatados (decidir quién es 3º).`);
    }
  }

  // Ordenar los 12 terceros por puntos, DG, GF (mejor primero)
  thirdRows.sort((a, b) => {
    const ka = thirdKey(a.row);
    const kb = thirdKey(b.row);
    return kb[0] - ka[0] || kb[1] - ka[1] || kb[2] - ka[2] || a.team.name.localeCompare(b.team.name);
  });

  const thirds: ThirdEntry[] = thirdRows.map((t, i) => ({
    group: t.group,
    team: t.team,
    row: t.row,
    qualified: i < 8,
  }));

  // Empate justo en la frontera 8º/9º tercero: decisión manual
  if (thirds.length >= 9 && sameKey(thirds[7].row, thirds[8].row)) {
    warnings.push(
      `Terceros: empate entre ${thirds[7].team.name} y ${thirds[8].team.name} por el último cupo (decidir cuál clasifica).`
    );
  }

  const complete =
    groupMatches.length > 0 && groupMatches.every((m) => m.status === "finished");

  return { winners, runners, thirds, complete, warnings };
}
