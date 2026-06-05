import { Home, CalendarDays, ClipboardList, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Enlaces de navegación compartidos por la barra inferior (móvil) y la barra
// lateral (escritorio). Fuente única para no duplicar rutas/iconos.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/partidos", label: "Partidos", icon: CalendarDays },
  { href: "/mis-predicciones", label: "Mis picks", icon: ClipboardList },
  { href: "/ranking", label: "Ranking", icon: Trophy },
];

/** Determina si una ruta de navegación está activa según el pathname actual. */
export function isNavActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
