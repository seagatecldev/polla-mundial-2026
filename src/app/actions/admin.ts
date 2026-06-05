"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMatches, getTeams } from "@/lib/data";
import { computeQualification } from "@/lib/qualification";

export type AdminActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Códigos de los 8 partidos R32 cuyo visitante es un tercero (away_source='3?'). */
const THIRD_SLOTS = ["K7", "K8", "K9", "K10", "K11", "K12", "K13", "K14"];

/**
 * Genera (o regenera) el cuadro de Dieciseisavos a partir de los resultados de
 * grupos. Los 1º/2º se asignan automáticamente; los 8 terceros según la
 * asignación que confirma el admin.
 *
 * thirdsAssignment: lista { bracketCode (K7..K14) -> teamId del tercero }.
 */
export async function generateKnockout(
  thirdsAssignment: { bracketCode: string; teamId: number }[]
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const [teams, groupMatches] = await Promise.all([
    getTeams(),
    getMatches({ phase: "group" }),
  ]);

  const q = computeQualification(teams, groupMatches);
  if (!q.complete) {
    return { ok: false, error: "Aún faltan resultados de la fase de grupos." };
  }

  // --- Validación de la asignación de terceros ---
  const qualifiedThirdIds = new Set(q.thirds.filter((t) => t.qualified).map((t) => t.team.id));
  if (thirdsAssignment.length !== THIRD_SLOTS.length) {
    return { ok: false, error: "Debes asignar los 8 terceros clasificados." };
  }
  const slotSet = new Set(thirdsAssignment.map((a) => a.bracketCode));
  const teamSet = new Set(thirdsAssignment.map((a) => a.teamId));
  if (slotSet.size !== 8 || !THIRD_SLOTS.every((s) => slotSet.has(s))) {
    return { ok: false, error: "Asignación de llaves de terceros inválida." };
  }
  if (teamSet.size !== 8) {
    return { ok: false, error: "Hay terceros repetidos en la asignación." };
  }
  for (const a of thirdsAssignment) {
    if (!qualifiedThirdIds.has(a.teamId)) {
      return { ok: false, error: "Un tercero asignado no está entre los 8 mejores." };
    }
  }
  const thirdsMap: Record<string, number> = {};
  thirdsAssignment.forEach((a) => (thirdsMap[a.bracketCode] = a.teamId));

  // --- Mapa de fuentes de grupo a id de equipo ---
  const sourceToTeam: Record<string, number | null> = {};
  for (const g of Object.keys(q.winners)) sourceToTeam[`1${g}`] = q.winners[g]?.id ?? null;
  for (const g of Object.keys(q.runners)) sourceToTeam[`2${g}`] = q.runners[g]?.id ?? null;

  const supabase = createAdminClient();

  // Reinicio limpio de TODO el cuadro (borra resultados/predicciones de KO y
  // recalcula el ranking) para evitar estados inconsistentes al regenerar.
  const { error: eReset } = await supabase.rpc("reset_knockout");
  if (eReset) return { ok: false, error: "No se pudo reiniciar el cuadro." };

  const { data: r32, error: e1 } = await supabase
    .from("matches")
    .select("id, bracket_code, home_source, away_source")
    .eq("phase", "round_of_32");
  if (e1 || !r32) return { ok: false, error: "No se pudieron leer los partidos de R32." };

  // --- Resolver y actualizar cada partido de R32 ---
  for (const m of r32) {
    const homeId =
      m.home_source === "3?" ? thirdsMap[m.bracket_code] : sourceToTeam[m.home_source];
    const awayId =
      m.away_source === "3?" ? thirdsMap[m.bracket_code] : sourceToTeam[m.away_source];

    if (!homeId || !awayId) {
      return { ok: false, error: `No se pudo resolver el partido ${m.bracket_code}.` };
    }

    const { error: e2 } = await supabase
      .from("matches")
      .update({ home_team_id: homeId, away_team_id: awayId, status: "upcoming" })
      .eq("id", m.id);
    if (e2) return { ok: false, error: `Error al guardar ${m.bracket_code}.` };
  }

  revalidatePath("/admin");
  revalidatePath("/partidos");
  revalidatePath("/");
  return { ok: true, message: "Cuadro de Dieciseisavos generado correctamente." };
}
