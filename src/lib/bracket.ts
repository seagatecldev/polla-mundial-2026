// Utilidades del cuadro de eliminatorias (sin estado, reutilizables en cliente/servidor).

/** Extrae los grupos elegibles de un slot de tercero: "3[ABCDF]" -> ["A","B","C","D","F"]. */
export function parseEligibleGroups(src: string | null | undefined): string[] | null {
  if (!src) return null;
  const m = src.match(/^3\[([A-L]+)\]$/);
  return m ? m[1].split("") : null;
}

/**
 * Sugiere la asignación de terceros a llaves respetando la elegibilidad por grupo,
 * mediante emparejamiento bipartito máximo (algoritmo de Kuhn). Garantiza una
 * asignación completa y válida si existe (la tabla oficial FIFA siempre la tiene).
 * Devuelve { bracket_code -> teamId }.
 */
export function suggestThirdsAssignment(
  slots: { code: string; eligible: string[] }[],
  thirds: { teamId: number; group: string }[]
): Record<string, number> {
  const slotMatch: number[] = new Array(slots.length).fill(-1); // slot -> índice de tercero
  const thirdMatch: number[] = new Array(thirds.length).fill(-1); // tercero -> índice de slot

  function augment(s: number, seen: boolean[]): boolean {
    for (let t = 0; t < thirds.length; t++) {
      if (!seen[t] && slots[s].eligible.includes(thirds[t].group)) {
        seen[t] = true;
        if (thirdMatch[t] === -1 || augment(thirdMatch[t], seen)) {
          slotMatch[s] = t;
          thirdMatch[t] = s;
          return true;
        }
      }
    }
    return false;
  }

  for (let s = 0; s < slots.length; s++) {
    augment(s, new Array(thirds.length).fill(false));
  }

  const out: Record<string, number> = {};
  for (let s = 0; s < slots.length; s++) {
    if (slotMatch[s] !== -1) out[slots[s].code] = thirds[slotMatch[s]].teamId;
  }
  return out;
}
