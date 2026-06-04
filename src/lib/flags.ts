// Mapa de nombre de selección -> código ISO 3166-1 alpha-2 (para flagcdn.com).
// Inglaterra usa el código de subdivisión "gb-eng".
// Se usa para mostrar banderas como imágenes reales (los emojis de bandera
// no se renderizan en Windows).

export const NAME_TO_ISO: Record<string, string> = {
  // Grupo A
  "México": "mx",
  "Ecuador": "ec",
  "Uruguay": "uy",
  "Alemania": "de",
  // Grupo B
  "Argentina": "ar",
  "Marruecos": "ma",
  "Iraq": "iq",
  "Ucrania": "ua",
  // Grupo C
  "España": "es",
  "Brasil": "br",
  "Japón": "jp",
  "Camerún": "cm",
  // Grupo D
  "Francia": "fr",
  "Costa Rica": "cr",
  "Australia": "au",
  "Senegal": "sn",
  // Grupo E
  "Portugal": "pt",
  "Colombia": "co",
  "Arabia Saudita": "sa",
  "Bélgica": "be",
  // Grupo F
  "Estados Unidos": "us",
  "Países Bajos": "nl",
  "Nigeria": "ng",
  "Chile": "cl",
  // Grupo G
  "Inglaterra": "gb-eng",
  "Irán": "ir",
  "Honduras": "hn",
  "Sudáfrica": "za",
  // Grupo H
  "Italia": "it",
  "Perú": "pe",
  "Corea del Sur": "kr",
  "Túnez": "tn",
  // Grupo I
  "Canadá": "ca",
  "Venezuela": "ve",
  "Ghana": "gh",
  "Suiza": "ch",
  // Grupo J
  "Turquía": "tr",
  "Panamá": "pa",
  "Angola": "ao",
  "Paraguay": "py",
  // Grupo K
  "Croacia": "hr",
  "Indonesia": "id",
  "Egipto": "eg",
  "Bolivia": "bo",
  // Grupo L
  "Dinamarca": "dk",
  "Serbia": "rs",
  "Qatar": "qa",
  "Nueva Zelanda": "nz",
};

export function isoFor(name?: string | null): string | null {
  if (!name) return null;
  return NAME_TO_ISO[name] ?? null;
}
