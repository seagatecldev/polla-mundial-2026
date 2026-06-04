import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction, Profile, Team } from "@/lib/types";

// Selección de partido con sus equipos embebidos.
const MATCH_SELECT = `
  id, home_team_id, away_team_id, match_date, venue, city, phase, group_name,
  home_score, away_score, status,
  home_team:teams!matches_home_team_id_fkey ( id, name, flag_emoji, group_name, confederation ),
  away_team:teams!matches_away_team_id_fkey ( id, name, flag_emoji, group_name, confederation )
`;

/** Normaliza el resultado del join (Supabase devuelve relación como objeto o array). */
function normalizeMatch(row: any): Match {
  const pick = (t: any): Team | null => (Array.isArray(t) ? t[0] ?? null : t ?? null);
  return { ...row, home_team: pick(row.home_team), away_team: pick(row.away_team) };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").order("id");
  return data ?? [];
}

export async function getMatches(opts?: {
  phase?: string;
  group?: string;
  status?: string;
  limit?: number;
}): Promise<Match[]> {
  const supabase = await createClient();
  let q = supabase.from("matches").select(MATCH_SELECT).order("match_date");
  if (opts?.phase) q = q.eq("phase", opts.phase);
  if (opts?.group) q = q.eq("group_name", opts.group);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []).map(normalizeMatch);
}

export async function getUpcomingMatches(limit = 3): Promise<Match[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("status", "upcoming")
    .gt("match_date", new Date().toISOString())
    .order("match_date")
    .limit(limit);
  return (data ?? []).map(normalizeMatch);
}

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

export async function getLeaderboard(limit?: number): Promise<Profile[]> {
  const supabase = await createClient();
  let q = supabase
    .from("profiles")
    .select("*")
    .order("total_points", { ascending: false })
    .order("exact_scores", { ascending: false })
    .order("created_at", { ascending: true });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return data ?? [];
}
