"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PredictionActionResult = { ok: true } | { ok: false; error: string };

/**
 * Crea o actualiza la predicción del usuario actual para un partido.
 * La seguridad real (propiedad + bloqueo por hora) la garantiza RLS en la BD;
 * aquí solo validamos entrada y damos mensajes amigables.
 */
export async function upsertPrediction(
  matchId: number,
  predHome: number,
  predAway: number,
  predWinnerTeamId?: number | null
): Promise<PredictionActionResult> {
  if (
    !Number.isInteger(matchId) ||
    !Number.isInteger(predHome) ||
    !Number.isInteger(predAway) ||
    predHome < 0 ||
    predAway < 0 ||
    predHome > 99 ||
    predAway > 99
  ) {
    return { ok: false, error: "Marcador inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };

  // Validación previa: partido no empezado y con equipos definidos (RLS también lo impide).
  const { data: match } = await supabase
    .from("matches")
    .select("match_date, status, phase, home_team_id, away_team_id")
    .eq("id", matchId)
    .single();

  if (!match) return { ok: false, error: "El partido no existe." };
  if (match.home_team_id == null || match.away_team_id == null) {
    return { ok: false, error: "Este partido aún no tiene equipos definidos." };
  }
  if (new Date(match.match_date).getTime() <= Date.now() || match.status !== "upcoming") {
    return { ok: false, error: "Este partido ya comenzó. No puedes predecir." };
  }

  // En eliminatorias se exige el clasificado (uno de los dos equipos); en grupos es null.
  const isKnockout = match.phase !== "group";
  let winner: number | null = null;
  if (isKnockout) {
    if (predWinnerTeamId !== match.home_team_id && predWinnerTeamId !== match.away_team_id) {
      return { ok: false, error: "Elige qué equipo clasifica." };
    }
    winner = predWinnerTeamId ?? null;
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      pred_home: predHome,
      pred_away: predAway,
      pred_winner_team_id: winner,
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    return { ok: false, error: "No se pudo guardar tu predicción. Intenta de nuevo." };
  }

  revalidatePath("/partidos");
  revalidatePath("/mis-predicciones");
  revalidatePath("/");
  return { ok: true };
}
