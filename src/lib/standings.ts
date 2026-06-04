import type { Match, Team } from "@/lib/types";

export type StandingRow = {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

/**
 * Calcula la tabla de posiciones de un grupo a partir de los partidos finalizados.
 * Orden: puntos, diferencia de gol, goles a favor, nombre.
 */
export function computeStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const rows = new Map<number, StandingRow>();
  for (const team of teams) {
    rows.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (
      m.status !== "finished" ||
      m.home_score == null ||
      m.away_score == null ||
      m.home_team_id == null ||
      m.away_team_id == null
    ) {
      continue;
    }
    const home = rows.get(m.home_team_id);
    const away = rows.get(m.away_team_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.gf += m.home_score;
    home.ga += m.away_score;
    away.gf += m.away_score;
    away.ga += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.home_score < m.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  const result = Array.from(rows.values());
  result.forEach((r) => (r.gd = r.gf - r.ga));
  result.sort(
    (a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.team.name.localeCompare(b.team.name)
  );
  return result;
}
