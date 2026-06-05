"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS, getMatches, getTeams } from "@/lib/data";
import { computeQualification } from "@/lib/qualification";
import { parseEligibleGroups } from "@/lib/bracket";

export type AdminActionResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Genera (o regenera) el cuadro de Dieciseisavos a partir de los resultados de
 * grupos. Los 1º/2º se asignan automáticamente; los 8 terceros según la
 * asignación que confirma el admin, respetando los grupos elegibles de cada llave.
 *
 * thirdsAssignment: lista { bracketCode (73..104) -> teamId del tercero }.
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

  // Tercero clasificado -> grupo del que viene
  const qualifiedThirds = q.thirds.filter((t) => t.qualified);
  const thirdGroupById = new Map(qualifiedThirds.map((t) => [t.team.id, t.group]));

  // --- Validación de la asignación de terceros ---
  if (thirdsAssignment.length !== thirdSlots.length) {
    return { ok: false, error: `Debes asignar los ${thirdSlots.length} terceros clasificados.` };
  }
  const slotByCode = new Map(thirdSlots.map((s) => [s.code, s]));
  const usedTeams = new Set<number>();
  const thirdsMap: Record<string, number> = {};
  for (const a of thirdsAssignment) {
    const slot = slotByCode.get(a.bracketCode);
    if (!slot) return { ok: false, error: "Llave de tercero inválida." };
    const grp = thirdGroupById.get(a.teamId);
    if (!grp) return { ok: false, error: "Un tercero asignado no está entre los 8 mejores." };
    if (!slot.eligible.includes(grp)) {
      return {
        ok: false,
        error: `Ese tercero (grupo ${grp}) no puede ir en la llave ${a.bracketCode}.`,
      };
    }
    if (usedTeams.has(a.teamId)) {
      return { ok: false, error: "Hay terceros repetidos en la asignación." };
    }
    usedTeams.add(a.teamId);
    thirdsMap[a.bracketCode] = a.teamId;
  }

  // --- Mapa de fuentes de grupo a id de equipo ---
  const sourceToTeam: Record<string, number | null> = {};
  for (const g of Object.keys(q.winners)) sourceToTeam[`1${g}`] = q.winners[g]?.id ?? null;
  for (const g of Object.keys(q.runners)) sourceToTeam[`2${g}`] = q.runners[g]?.id ?? null;

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
