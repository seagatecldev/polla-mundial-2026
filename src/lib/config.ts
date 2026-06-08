// Configuración central de marca y funcionalidades (white-label).
// Todos los valores se leen de variables de entorno NEXT_PUBLIC_* con un
// DEFAULT igual a los valores actuales de la empresa (Seagate). Así, sin
// variables nuevas, la app se comporta idéntica a hoy; otro cliente solo
// cambia su .env para re-marcar la aplicación.

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "Seagate Mundial 2026",
    tagline:
      process.env.NEXT_PUBLIC_APP_TAGLINE ??
      "El Mundial de Seagate. Predice, acierta y gana.",
    description:
      process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
      "El torneo de predicciones del Mundial FIFA 2026: predice los marcadores, gana puntos y compite en el ranking.",
  },
  brand: {
    // Logo principal (en la empresa: escudo de Ecuador). Logo secundario opcional.
    logoPrimary: process.env.NEXT_PUBLIC_LOGO_PRIMARY ?? "/escudo-ecuador.png",
    logoPrimaryAlt: process.env.NEXT_PUBLIC_LOGO_PRIMARY_ALT ?? "Escudo",
    // Si no se define, no se muestra el segundo logo ni el separador.
    logoSecondary: process.env.NEXT_PUBLIC_LOGO_SECONDARY ?? "/seagate.png",
    logoSecondaryAlt: process.env.NEXT_PUBLIC_LOGO_SECONDARY_ALT ?? "Logo",
  },
  features: {
    // Registro restringido por cédula (lista blanca de empleados).
    // Por defecto ACTIVADO (versión empresa). Se desactiva con "false".
    requireCedula: process.env.NEXT_PUBLIC_REQUIRE_CEDULA !== "false",
  },
  // Color de marca principal (para metadata themeColor; el tema visual completo
  // se define en tailwind.config.ts leyendo las mismas variables en build).
  colorPrimary: process.env.NEXT_PUBLIC_COLOR_PRIMARY ?? "#152C5B",
} as const;
