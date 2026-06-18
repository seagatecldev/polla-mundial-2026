import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS, getLeaderboard, getMatches } from "@/lib/data";
import type { Match, Profile } from "@/lib/types";

// ============================================================================
// Capa de estadísticas / gamificación. TODO se deriva en el servidor cruzando
// predicciones + partidos + perfiles que ya existen — sin migraciones ni tablas
// nuevas, así funciona igual en todas las instancias (Seagate, Aquaspot, demo).
// ============================================================================

// "Fecha/jornada" = partidos jugados el mismo día calendario en hora Ecuador.
const EC_TZ = "America/Guayaquil";
const DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: EC_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const LABEL_FMT = new Intl.DateTimeFormat("es", {
  timeZone: EC_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
});

function ecDay(iso: string): string {
  return DAY_FMT.format(new Date(iso)); // "2026-06-18"
}
function ecLabel(iso: string): string {
  const s = LABEL_FMT.format(new Date(iso)); // "mié 18 jun"
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Carga base: todas las predicciones (paginadas para no caer en el tope de 1000)
// ---------------------------------------------------------------------------
type Pred = {
  user_id: string;
  match_id: number;
  points_earned: number | null;
  created_at: string;
};

const PAGE_SIZE = 1000;

const getAllPredictions = unstable_cache(
  async (): Promise<Pred[]> => {
    const supabase = createAdminClient();
    const rows: Pred[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("predictions")
        .select("user_id, match_id, points_earned, created_at")
        .range(from, from + PAGE_SIZE - 1);
      if (error) return from === 0 ? [] : rows;
      const batch = (data ?? []) as Pred[];
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return rows;
  },
  ["all-predictions"],
  { revalidate: 120, tags: [CACHE_TAGS.leaderboard, CACHE_TAGS.matches] }
);

// ---------------------------------------------------------------------------
// Fechas (jornadas) a partir de los partidos terminados
// ---------------------------------------------------------------------------
export type FechaInfo = {
  id: string; // día EC "2026-06-18"
  label: string; // "Mié 18 jun"
  matchIds: number[];
  cutoff: string; // ISO del último partido de esa fecha
};

function buildFechas(matches: Match[]): FechaInfo[] {
  const byDay = new Map<string, { ids: number[]; max: string }>();
  for (const m of matches) {
    if (m.status !== "finished") continue;
    const day = ecDay(m.match_date);
    const cur = byDay.get(day);
    if (cur) {
      cur.ids.push(m.id);
      if (m.match_date > cur.max) cur.max = m.match_date;
    } else {
      byDay.set(day, { ids: [m.id], max: m.match_date });
    }
  }
  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([id, v]) => ({ id, label: ecLabel(v.max), matchIds: v.ids, cutoff: v.max }));
}

export async function getFechas(): Promise<FechaInfo[]> {
  return buildFechas(await getMatches());
}

// ---------------------------------------------------------------------------
// Ranking de la fecha + MVP
// ---------------------------------------------------------------------------
export type FechaRankingEntry = { profile: Profile; puntos: number };
export type FechaRanking = {
  fecha: FechaInfo | null;
  entries: FechaRankingEntry[]; // ordenado desc; [0] = MVP de la fecha
};

export async function getFechaRanking(fechaId?: string): Promise<FechaRanking> {
  const [matches, preds, profiles] = await Promise.all([
    getMatches(),
    getAllPredictions(),
    getLeaderboard(),
  ]);
  const fechas = buildFechas(matches);
  if (fechas.length === 0) return { fecha: null, entries: [] };

  const fecha = (fechaId && fechas.find((f) => f.id === fechaId)) || fechas[fechas.length - 1];
  const inFecha = new Set(fecha.matchIds);
  const profById = new Map(profiles.map((p) => [p.id, p]));

  const puntosByUser = new Map<string, number>();
  for (const p of preds) {
    if (p.points_earned == null || !inFecha.has(p.match_id)) continue;
    puntosByUser.set(p.user_id, (puntosByUser.get(p.user_id) ?? 0) + p.points_earned);
  }

  const entries: FechaRankingEntry[] = Array.from(puntosByUser.entries())
    .map(([userId, puntos]) => ({ profile: profById.get(userId), puntos }))
    .filter((e): e is FechaRankingEntry => Boolean(e.profile))
    .sort((a, b) => b.puntos - a.puntos || a.profile.display_name.localeCompare(b.profile.display_name));

  return { fecha, entries };
}

// ---------------------------------------------------------------------------
// Movimiento de puestos (↑↓) entre la última fecha y la anterior
// ---------------------------------------------------------------------------

/** Ranking (userId → posición 1..N) sumando puntos de partidos con fecha <= corte. */
function rankAtCutoff(preds: Pred[], matchDate: Map<number, string>, cutoff: string): Map<string, number> {
  const totals = new Map<string, number>();
  for (const p of preds) {
    if (p.points_earned == null) continue;
    const d = matchDate.get(p.match_id);
    if (!d || d > cutoff) continue;
    totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + p.points_earned);
  }
  const ordered = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const rank = new Map<string, number>();
  ordered.forEach(([userId], i) => rank.set(userId, i + 1));
  return rank;
}

/** Movimiento entre dos cortes: userId → (positivo subió, negativo bajó, 0 igual). */
function movementBetween(
  preds: Pred[],
  matchDate: Map<number, string>,
  prevCutoff: string,
  currCutoff: string
): Map<string, number> {
  const prev = rankAtCutoff(preds, matchDate, prevCutoff);
  const curr = rankAtCutoff(preds, matchDate, currCutoff);
  const lastPrev = prev.size; // peor puesto previo, para quien no estaba
  const move = new Map<string, number>();
  Array.from(curr.entries()).forEach(([userId, cr]) => {
    const pr = prev.get(userId) ?? lastPrev + 1;
    move.set(userId, pr - cr); // subir de puesto 8→2 = +6
  });
  return move;
}

/** Movimiento de la última fecha vs la anterior (para las flechas del ranking). */
export async function getRankMovement(): Promise<Record<string, number>> {
  const [matches, preds] = await Promise.all([getMatches(), getAllPredictions()]);
  const fechas = buildFechas(matches);
  if (fechas.length < 2) return {};
  const matchDate = new Map(matches.map((m) => [m.id, m.match_date]));
  const curr = fechas[fechas.length - 1];
  const prev = fechas[fechas.length - 2];
  return Object.fromEntries(movementBetween(preds, matchDate, prev.cutoff, curr.cutoff));
}

// ---------------------------------------------------------------------------
// Logros / insignias + racha
// ---------------------------------------------------------------------------
export type Badge = {
  id: string;
  emoji: string;
  nombre: string;
  desc: string;
  desbloqueado: boolean;
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const [matches, preds, profiles] = await Promise.all([
    getMatches(),
    getAllPredictions(),
    getLeaderboard(),
  ]);
  const profile = profiles.find((p) => p.id === userId);
  const mine = preds.filter((p) => p.user_id === userId);
  const matchDate = new Map(matches.map((m) => [m.id, m.match_date]));
  const fechas = buildFechas(matches);

  // ⏰ Madrugador: alguna predicción hecha > 3 días antes del partido.
  const madrugador = mine.some((p) => {
    const d = matchDate.get(p.match_id);
    return d && new Date(d).getTime() - new Date(p.created_at).getTime() > THREE_DAYS_MS;
  });

  // 🔥 Pleno de la fecha: en alguna fecha, predijo TODOS sus partidos y todos sumaron puntos.
  const myByMatch = new Map(mine.map((p) => [p.match_id, p]));
  const pleno = fechas.some((f) => {
    const preds = f.matchIds.map((id) => myByMatch.get(id));
    return preds.length > 0 && preds.every((p) => p && (p.points_earned ?? 0) > 0);
  });

  // 📈 Remontada: subió ≥5 puestos en alguna fecha.
  let remontada = false;
  if (fechas.length >= 2) {
    for (let i = 1; i < fechas.length; i++) {
      const move = movementBetween(preds, matchDate, fechas[i - 1].cutoff, fechas[i].cutoff);
      if ((move.get(userId) ?? 0) >= 5) {
        remontada = true;
        break;
      }
    }
  }

  const exactos = profile?.exact_scores ?? 0;

  return [
    {
      id: "primer-exacto",
      emoji: "🎯",
      nombre: "Primer exacto",
      desc: "Acertó al menos un marcador exacto.",
      desbloqueado: exactos >= 1,
    },
    {
      id: "profeta",
      emoji: "🔮",
      nombre: "Profeta",
      desc: "5 o más marcadores exactos.",
      desbloqueado: exactos >= 5,
    },
    {
      id: "madrugador",
      emoji: "⏰",
      nombre: "Madrugador",
      desc: "Predijo un partido con más de 3 días de anticipación.",
      desbloqueado: madrugador,
    },
    {
      id: "pleno",
      emoji: "🔥",
      nombre: "Pleno de la fecha",
      desc: "Sumó puntos en todos los partidos de una fecha.",
      desbloqueado: pleno,
    },
    {
      id: "remontada",
      emoji: "📈",
      nombre: "Remontada",
      desc: "Subió 5 o más puestos en una sola fecha.",
      desbloqueado: remontada,
    },
  ];
}

/** Racha actual de aciertos: partidos finished consecutivos (recientes) con puntos > 0. */
export async function getRacha(userId: string): Promise<number> {
  const [matches, preds] = await Promise.all([getMatches(), getAllPredictions()]);
  const finishedIds = new Map(
    matches.filter((m) => m.status === "finished").map((m) => [m.id, m.match_date])
  );
  const mine = preds
    .filter((p) => p.user_id === userId && finishedIds.has(p.match_id))
    .sort((a, b) => {
      const da = finishedIds.get(a.match_id) as string;
      const db = finishedIds.get(b.match_id) as string;
      return da < db ? 1 : -1; // del más reciente al más antiguo
    });
  let racha = 0;
  for (const p of mine) {
    if ((p.points_earned ?? 0) > 0) racha++;
    else break;
  }
  return racha;
}

// ---------------------------------------------------------------------------
// Promedios del grupo (para "tú vs promedio")
// ---------------------------------------------------------------------------
export type Averages = { avgAccuracy: number; avgPoints: number; avgExactos: number };

export async function getAverages(): Promise<Averages> {
  const profiles = (await getLeaderboard()).filter((p) => p.predictions_count > 0);
  if (profiles.length === 0) return { avgAccuracy: 0, avgPoints: 0, avgExactos: 0 };
  const n = profiles.length;
  const sumAcc = profiles.reduce(
    (s, p) => s + (p.correct_results / p.predictions_count) * 100,
    0
  );
  const sumPts = profiles.reduce((s, p) => s + p.total_points, 0);
  const sumExa = profiles.reduce((s, p) => s + p.exact_scores, 0);
  return {
    avgAccuracy: Math.round(sumAcc / n),
    avgPoints: Math.round((sumPts / n) * 10) / 10,
    avgExactos: Math.round((sumExa / n) * 10) / 10,
  };
}
