// Utilidades compartidas

/** Une clases condicionales sin dependencias externas. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formatea una fecha ISO (UTC) a la zona horaria del navegador: "vie 12 jun · 15:00". */
export function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  const fecha = new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  const hora = new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${capitalize(fecha)} · ${hora}`;
}

/** Solo la hora local: "15:00". */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Iniciales para el avatar a partir del nombre. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** ¿El partido ya empezó? (predicciones bloqueadas) */
export function hasStarted(matchDateIso: string): boolean {
  return new Date(matchDateIso).getTime() <= Date.now();
}

/**
 * Color de fondo determinista (hex) para un avatar a partir de un id.
 * Devuelve un hex para aplicarlo con `style`, evitando que Tailwind
 * purgue clases generadas dinámicamente.
 */
export function avatarColor(seed: string): string {
  const palette = [
    "#152C5B", // pitch (azul marino)
    "#C8102E", // flame
    "#2563EB", // blue-600
    "#7C3AED", // purple-600
    "#EA580C", // orange-600
    "#0D9488", // teal-600
    "#DB2777", // pink-600
    "#4F46E5", // indigo-600
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
