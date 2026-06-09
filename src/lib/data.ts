import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Match, Prediction, Profile, Team } from "@/lib/types";

/**
 * Etiquetas de caché para los datos PÚBLICOS y COMPARTIDOS (iguales para todos
 * los usuarios). Permiten invalidación instantánea cuando el admin escribe.
 *  - "matches": partidos (resultados, cuadro)
 *  - "leaderboard": ranking / puntos de perfiles
 *  - "teams": equipos (casi estático)
 */
export const CACHE_TAGS = {
  matches: "matches",
  leaderboard: "leaderboard",
  teams: "teams",
} as const;

// TTL de datos compartidos: protege contra ráfagas y reduce cache-misses (menos
// renders pesados). Las escrituras del admin invalidan por etiqueta al instante,
// así que un TTL holgado no retrasa los resultados reales.
const SHARED_TTL = 120;

// Selección de partido con sus equipos embebidos.
const MATCH_SELECT = `
  id, home_team_id, away_team_id, match_date, venue, city, phase, group_name,
  home_score, away_score, status, bracket_code, home_source, away_source,
  home_team:teams!matches_home_team_id_fkey ( id, name, flag_emoji, group_name, confederation ),
  away_team:teams!matches_away_team_id_fkey ( id, name, flag_emoji, group_name, confederation )
`;

/** Normaliza el resultado del join (Supabase devuelve relación como objeto o array). */
function normalizeMatch(row: any): Match {
  const pick = (t: any): Team | null => (Array.isArray(t) ? t[0] ?? null : t ?? null);
  return { ...row, home_team: pick(row.home_team), away_team: pick(row.away_team) };
}

// Memoizado por request (React cache): aunque lo llamen el middleware-no, el
// layout y la página, dentro de un mismo render se ejecuta una sola vez.
// Reduce llamadas de auth.getUser() por carga → menos trabajo en Vercel.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
});

// Datos públicos (equipos): casi estáticos. Cacheados largo, invalidan por "teams".
export const getTeams = unstable_cache(
  async (): Promise<Team[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase.from("teams").select("*").order("id");
    return data ?? [];
  },
  ["teams-v2"],
  { revalidate: 600, tags: [CACHE_TAGS.teams] }
);

type MatchOpts = { phase?: string; group?: string; status?: string; limit?: number };

// Datos públicos (partidos): compartidos por todos. Cacheados con TTL corto +
// invalidación por etiqueta "matches" al cargar resultados.
export const getMatches = unstable_cache(
  async (opts?: MatchOpts): Promise<Match[]> => {
    const supabase = createAdminClient();
    let q = supabase.from("matches").select(MATCH_SELECT).order("match_date");
    if (opts?.phase) q = q.eq("phase", opts.phase);
    if (opts?.group) q = q.eq("group_name", opts.group);
    if (opts?.status) q = q.eq("status", opts.status);
    if (opts?.limit) q = q.limit(opts.limit);
    const { data } = await q;
    return (data ?? []).map(normalizeMatch);
  },
  ["matches"],
  { revalidate: SHARED_TTL, tags: [CACHE_TAGS.matches] }
);

export const getUpcomingMatches = unstable_cache(
  async (limit = 3): Promise<Match[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("status", "upcoming")
      .gt("match_date", new Date().toISOString())
      .order("match_date")
      .limit(limit);
    return (data ?? []).map(normalizeMatch);
  },
  ["upcoming-matches"],
  { revalidate: SHARED_TTL, tags: [CACHE_TAGS.matches] }
);

/** Predicciones del usuario indexadas por match_id, para pintar rápido. */
export async function getUserPredictionsMap(
  userId: string
): Promise<Record<number, Prediction>> {
  const supabase = await createClient();
  const { data } = await supabase.from("predictions").select("*").eq("user_id", userId);
  const map: Record<number, Prediction> = {};
  (data ?? []).forEach((p) => (map[p.match_id] = p));
  return map;
}

/** Predicciones del usuario con el partido embebido (para /mis-predicciones). */
export async function getUserPredictionsWithMatch(userId: string): Promise<Prediction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("predictions")
    .select(`*, match:matches!predictions_match_id_fkey ( ${MATCH_SELECT} )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((p: any) => ({
    ...p,
    match: p.match ? normalizeMatch(p.match) : undefined,
  }));
}

// Ranking: compartido por todos. Cacheado con TTL corto + invalidación por
// etiqueta "leaderboard" cuando cambian los puntos (resultados del admin).
export const getLeaderboard = unstable_cache(
  async (limit?: number): Promise<Profile[]> => {
    const supabase = createAdminClient();
    let q = supabase
      .from("profiles")
      .select("*")
      .order("total_points", { ascending: false })
      .order("exact_scores", { ascending: false })
      .order("created_at", { ascending: true });
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return data ?? [];
  },
  ["leaderboard"],
  { revalidate: SHARED_TTL, tags: [CACHE_TAGS.leaderboard] }
);
