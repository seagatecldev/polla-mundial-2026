import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS } from "@/lib/data";

/**
 * Finaliza un partido y recalcula puntos de TODAS sus predicciones de forma
 * atómica mediante la función SQL public.set_match_result.
 *
 * Seguridad: solo el administrador (verificado por sesión, no por el cliente).
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { matchId, homeScore, awayScore, winnerTeamId } = (body ?? {}) as Record<string, unknown>;
  if (
    !Number.isInteger(matchId) ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    (homeScore as number) < 0 ||
    (awayScore as number) < 0
  ) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // El tipo de partido decide qué función usar (no se confía en el cliente).
  const { data: match } = await supabase
    .from("matches")
    .select("phase, home_team_id, away_team_id")
    .eq("id", matchId as number)
    .single();
  if (!match) {
    return NextResponse.json({ ok: false, error: "Partido no encontrado" }, { status: 404 });
  }

  const h = homeScore as number;
  const a = awayScore as number;

  if (match.phase === "group") {
    const { data, error } = await supabase.rpc("set_match_result", {
      p_match_id: matchId,
      p_home_score: h,
      p_away_score: a,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    // Resultado nuevo → invalidar partidos y ranking al instante.
    revalidateTag(CACHE_TAGS.matches);
    revalidateTag(CACHE_TAGS.leaderboard);
    return NextResponse.json({ ok: true, updated: data ?? 0 });
  }

  // Eliminatoria: si no es empate, el ganador se deriva del marcador;
  // si es empate (penales), el admin debe indicar quién avanzó.
  let winner: number | null = null;
  if (h > a) winner = match.home_team_id;
  else if (a > h) winner = match.away_team_id;
  else if (Number.isInteger(winnerTeamId)) winner = winnerTeamId as number;

  if (!winner) {
    return NextResponse.json(
      { ok: false, error: "Empate: indica qué equipo avanzó (penales)." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("set_knockout_result", {
    p_match_id: matchId,
    p_home: h,
    p_away: a,
    p_winner_team_id: winner,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  // Resultado de eliminatoria → avanza el cuadro y cambia puntos: invalidar ambos.
  revalidateTag(CACHE_TAGS.matches);
  revalidateTag(CACHE_TAGS.leaderboard);
  return NextResponse.json({ ok: true, updated: data ?? 0 });
}

/** Cambia el estado de un partido (upcoming / live / finished). */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { matchId, status } = (body ?? {}) as Record<string, unknown>;
  const validStatus = ["upcoming", "live", "finished"];
  if (!Number.isInteger(matchId) || typeof status !== "string" || !validStatus.includes(status)) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("matches")
    .update({ status })
    .eq("id", matchId as number);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Cambio de estado del partido → invalidar la caché de partidos.
  revalidateTag(CACHE_TAGS.matches);
  return NextResponse.json({ ok: true });
}
