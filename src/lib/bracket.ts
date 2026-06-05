// Utilidades del cuadro de eliminatorias (sin estado, reutilizables en cliente/servidor).

/** Extrae los grupos elegibles de un slot de tercero: "3[ABCDF]" -> ["A","B","C","D","F"]. */
export function parseEligibleGroups(src: string | null | undefined): string[] | null {
  if (!src) return null;
  const m = src.match(/^3\[([A-L]+)\]$/);
  return m ? m[1].split("") : null;
}
