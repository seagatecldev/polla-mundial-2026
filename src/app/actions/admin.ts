"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS, getMatches, getTeams } from "@/lib/data";
import {
  computeQualification,
  buildGroupTables,
  defaultPositions,
  defaultQualifiedThirdIds,
  validateResolution,
  type Resolution,
} from "@/lib/qualification";
import { parseEligibleGroups, suggestThirdsAssignment } from "@/lib/bracket";

export type AdminActionResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Genera (o regenera) el cuadro de Dieciseisavos a partir de los resultados de
 * grupos. El admin confirma el orden (1º/2º/3º por grupo), qué terceros
 * clasifican y su asignación a las llaves, todo dentro de una `resolution`.
 * Si no se envía resolución, se usa el cálculo automático actual (no-regresión).
 */
export async function generateKnockout(resolution?: Resolution): Promise<AdminActionResult> {
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

  const tables = buildGroupTables(teams, groupMatches);
  const supabase = createAdminClient();

  // Leer las llaves de R32 (incluye las fuentes y el formato de tercero)
  const { data: r32, error: e1 } = await supabase
    .from("matches")
    .select("id, bracket_code, home_source, away_source")
    .eq("phase", "round_of_32");
  if (e1 || !r32) return { ok: false, error: "No se pudieron leer los partidos de R32." };

  // Llaves cuyo visitante es un tercero, con sus grupos elegibles
  const thirdSlots = r32
    .map((m) => ({ code: m.bracket_code as string, eligible: parseEligibleGroups(m.away_source) }))
    .filter((s): s is { code: string; eligible: string[] } => s.eligible !== null);

  // Respaldo: si no llega resolución, reconstruir la automática (orden actual).
  if (!resolution) {
    const positions = defaultPositions(tables);
    const qualified = defaultQualifiedThirdIds(positions, tables);
    const groupByTeam = new Map(positions.map((p) => [p.thirdId, p.group]));
    const assignment = suggestThirdsAssignment(
      thirdSlots,
      qualified.map((id) => ({ teamId: id, group: groupByTeam.get(id) as string }))
    );
    resolution = {
      positions,
      thirdsAssignment: Object.entries(assignment).map(([bracketCode, teamId]) => ({
        bracketCode,
        teamId,
      })),
    };
  }

  // --- Validación estructural de la resolución (1º/2º/3º, terceros) ---
  const v = validateResolution(tables, resolution);
  if (!v.ok) return { ok: false, error: v.error };

  // --- Validación de elegibilidad por llave (3[GRUPOS]) ---
  const thirdGroupById = new Map(resolution.positions.map((p) => [p.thirdId, p.group]));
  if (resolution.thirdsAssignment.length !== thirdSlots.length) {
    return { ok: false, error: `Debes asignar los ${thirdSlots.length} terceros clasificados.` };
  }
  const slotByCode = new Map(thirdSlots.map((s) => [s.code, s]));
  const thirdsMap: Record<string, number> = {};
  for (const a of resolution.thirdsAssignment) {
    const slot = slotByCode.get(a.bracketCode);
    if (!slot) return { ok: false, error: "Llave de tercero inválida." };
    const grp = thirdGroupById.get(a.teamId);
    if (!grp) return { ok: false, error: "Un tercero asignado no es 3º de ningún grupo." };
    if (!slot.eligible.includes(grp)) {
      return {
        ok: false,
        error: `Ese tercero (grupo ${grp}) no puede ir en la llave ${a.bracketCode}.`,
      };
    }
    thirdsMap[a.bracketCode] = a.teamId;
  }

  // --- Mapa de fuentes de grupo a id de equipo (según la resolución) ---
  const sourceToTeam: Record<string, number | null> = {};
  for (const p of resolution.positions) {
    sourceToTeam[`1${p.group}`] = p.firstId;
    sourceToTeam[`2${p.group}`] = p.secondId;
  }

  // Reinicio limpio de TODO el cuadro (evita estados inconsistentes al regenerar)
  const { error: eReset } = await supabase.rpc("reset_knockout");
  if (eReset) return { ok: false, error: "No se pudo reiniciar el cuadro." };

  // --- Resolver y actualizar cada partido de R32 ---
  for (const m of r32) {
    const resolve = (src: string) =>
      parseEligibleGroups(src) ? thirdsMap[m.bracket_code as string] : sourceToTeam[src];
    const homeId = resolve(m.home_source);
    const awayId = resolve(m.away_source);

    if (!homeId || !awayId) {
      return { ok: false, error: `No se pudo resolver el partido ${m.bracket_code}.` };
    }

    const { error: e2 } = await supabase
      .from("matches")
      .update({ home_team_id: homeId, away_team_id: awayId, status: "upcoming" })
      .eq("id", m.id);
    if (e2) return { ok: false, error: `Error al guardar ${m.bracket_code}.` };
  }

  // El cuadro se rellenó/reinició y se recalcularon perfiles: invalidar caché.
  revalidateTag(CACHE_TAGS.matches);
  revalidateTag(CACHE_TAGS.leaderboard);
  revalidatePath("/admin");
  revalidatePath("/partidos");
  revalidatePath("/");
  return { ok: true, message: "Cuadro de Dieciseisavos generado correctamente." };
}
