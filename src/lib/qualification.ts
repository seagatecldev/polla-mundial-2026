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

// ===========================================================================
// Resolución manual del orden de clasificación (desempates) — funciones puras.
// El admin puede confirmar/ajustar 1º/2º/3º por grupo y qué terceros clasifican.
// Por defecto reproducen el cálculo automático actual (no-regresión).
// ===========================================================================

/** Posiciones elegidas de un grupo (4º no importa). */
export type GroupPositions = { group: string; firstId: number; secondId: number; thirdId: number };

/** Resolución completa que el cliente envía y el servidor valida. */
export type Resolution = {
  positions: GroupPositions[];
  thirdsAssignment: { bracketCode: string; teamId: number }[];
};

/** Tercero en el ranking (para la UI de "qué 8 clasifican"). */
export type RankedThird = { teamId: number; group: string; team: Team; row: StandingRow };

/** Tabla ordenada por grupo (reutiliza computeStandings: misma lógica que la tabla visible). */
export function buildGroupTables(
  teams: Team[],
  groupMatches: Match[]
): Record<string, StandingRow[]> {
  const tables: Record<string, StandingRow[]> = {};
  for (const g of GROUPS) {
    const groupTeams = teams.filter((t) => t.group_name === g);
    const matches = groupMatches.filter((m) => m.group_name === g);
    tables[g] = computeStandings(groupTeams, matches);
  }
  return tables;
}

/** Posiciones por defecto (1º/2º/3º) = orden actual de cada tabla. */
export function defaultPositions(tables: Record<string, StandingRow[]>): GroupPositions[] {
  return GROUPS.filter((g) => (tables[g]?.length ?? 0) >= 3).map((g) => ({
    group: g,
    firstId: tables[g][0].team.id,
    secondId: tables[g][1].team.id,
    thirdId: tables[g][2].team.id,
  }));
}

/** Los terceros (según positions.thirdId) ordenados mejor→peor. */
export function rankThirds(
  positions: GroupPositions[],
  tables: Record<string, StandingRow[]>
): RankedThird[] {
  const arr = positions
    .map((p): RankedThird | null => {
      const row = tables[p.group]?.find((r) => r.team.id === p.thirdId);
      return row ? { teamId: p.thirdId, group: p.group, team: row.team, row } : null;
    })
    .filter((x): x is RankedThird => x !== null);
  arr.sort(
    (a, b) =>
      b.row.points - a.row.points ||
      b.row.gd - a.row.gd ||
      b.row.gf - a.row.gf ||
      a.team.name.localeCompare(b.team.name)
  );
  return arr;
}

/** IDs de los 8 mejores terceros por defecto. */
export function defaultQualifiedThirdIds(
  positions: GroupPositions[],
  tables: Record<string, StandingRow[]>
): number[] {
  return rankThirds(positions, tables)
    .slice(0, 8)
    .map((t) => t.teamId);
}

/**
 * Valida la integridad ESTRUCTURAL de una resolución (no exige empate):
 *  - cada grupo aparece una vez; 1º/2º/3º son 3 equipos distintos del grupo;
 *  - los terceros asignados son 3º de algún grupo y no se repiten.
 * La elegibilidad por llave (3[GRUPOS]) la valida el servidor con los slots de R32.
 */
export function validateResolution(
  tables: Record<string, StandingRow[]>,
  resolution: Resolution
): { ok: true } | { ok: false; error: string } {
  const groupsWith3 = GROUPS.filter((g) => (tables[g]?.length ?? 0) >= 3);
  const posByGroup = new Map<string, GroupPositions>();
  for (const p of resolution.positions) {
    if (posByGroup.has(p.group)) return { ok: false, error: `Grupo ${p.group} repetido.` };
    posByGroup.set(p.group, p);
  }
  for (const g of groupsWith3) {
    const p = posByGroup.get(g);
    if (!p) return { ok: false, error: `Falta el orden del grupo ${g}.` };
    const ids = [p.firstId, p.secondId, p.thirdId];
    if (new Set(ids).size !== 3)
      return { ok: false, error: `Grupo ${g}: 1º, 2º y 3º deben ser equipos distintos.` };
    const groupIds = new Set(tables[g].map((r) => r.team.id));
    if (!ids.every((id) => groupIds.has(id)))
      return { ok: false, error: `Grupo ${g}: un equipo no pertenece al grupo.` };
  }
  const thirdIds = new Set(resolution.positions.map((p) => p.thirdId));
  const used = new Set<number>();
  for (const a of resolution.thirdsAssignment) {
    if (!thirdIds.has(a.teamId))
      return { ok: false, error: "Un tercero asignado no es 3º de ningún grupo." };
    if (used.has(a.teamId)) return { ok: false, error: "Hay terceros repetidos en la asignación." };
    used.add(a.teamId);
  }
  return { ok: true };
}
