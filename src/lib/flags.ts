// Mapa de nombre de selección -> código ISO 3166-1 alpha-2 (para flagcdn.com).
// Escocia/Inglaterra usan subdivisiones "gb-sct"/"gb-eng".
// Se usa para mostrar banderas como imágenes reales (los emojis de bandera
// no se renderizan en Windows). Coincide con los 48 equipos del Mundial 2026.

export const NAME_TO_ISO: Record<string, string> = {
  // Grupo A
  "México": "mx",
  "Sudáfrica": "za",
  "Corea del Sur": "kr",
  "República Checa": "cz",
  // Grupo B
  "Canadá": "ca",
  "Bosnia y Herzegovina": "ba",
  "Catar": "qa",
  "Suiza": "ch",
  // Grupo C
  "Brasil": "br",
  "Marruecos": "ma",
  "Haití": "ht",
  "Escocia": "gb-sct",
  // Grupo D
  "Estados Unidos": "us",
  "Paraguay": "py",
  "Australia": "au",
  "Turquía": "tr",
  // Grupo E
  "Alemania": "de",
  "Curazao": "cw",
  "Costa de Marfil": "ci",
  "Ecuador": "ec",
  // Grupo F
  "Países Bajos": "nl",
  "Japón": "jp",
  "Suecia": "se",
  "Túnez": "tn",
  // Grupo G
  "Bélgica": "be",
  "Egipto": "eg",
  "Irán": "ir",
  "Nueva Zelanda": "nz",
  // Grupo H
  "España": "es",
  "Cabo Verde": "cv",
  "Arabia Saudí": "sa",
  "Uruguay": "uy",
  // Grupo I
  "Francia": "fr",
  "Senegal": "sn",
  "Irak": "iq",
  "Noruega": "no",
  // Grupo J
  "Argentina": "ar",
  "Argelia": "dz",
  "Austria": "at",
  "Jordania": "jo",
  // Grupo K
  "Portugal": "pt",
  "RD Congo": "cd",
  "Uzbekistán": "uz",
  "Colombia": "co",
  // Grupo L
  "Inglaterra": "gb-eng",
  "Croacia": "hr",
  "Ghana": "gh",
  "Panamá": "pa",
};

export function isoFor(name?: string | null): string | null {
  if (!name) return null;
  return NAME_TO_ISO[name] ?? null;
}
