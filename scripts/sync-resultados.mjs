// =============================================================================
//  Sincronización de resultados maestro → clientes (instancias Supabase separadas).
//
//  El vendedor ingresa los resultados UNA vez en la instancia "maestra" (su /admin)
//  y este script los replica a cada cliente, que recalcula SUS propios puntos.
//
//  Requisitos:
//   - Cada cliente es una RÉPLICA IDÉNTICA (mismas migraciones) → IDs alineados.
//   - scripts/sync.config.json (NO se sube al repo) con las service_role keys.
//
//  Uso:
//   node scripts/sync-resultados.mjs            (aplica los cambios)
//   node scripts/sync-resultados.mjs --dry-run  (solo muestra, no escribe)
// =============================================================================
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");

const cfgUrl = new URL("./sync.config.json", import.meta.url);
let cfg;
try {
  cfg = JSON.parse(readFileSync(cfgUrl, "utf8"));
} catch {
  console.error(
    "✖ Falta scripts/sync.config.json. Copia scripts/sync.config.example.json y complétalo."
  );
  process.exit(1);
}

const admin = (p) =>
  createClient(p.url, p.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const MATCH_COLS =
  "id,bracket_code,phase,home_team_id,away_team_id,home_score,away_score,status,home_source,away_source";

async function readMatches(client) {
  const { data, error } = await client.from("matches").select(MATCH_COLS).order("id");
  if (error) throw error;
  return data;
}
async function readTeams(client) {
  const { data, error } = await client.from("teams").select("id,name").order("id");
  if (error) throw error;
  return data;
}

/** Deriva el equipo que clasifica de un partido de eliminatoria del maestro. */
function deriveWinner(m, matches) {
  if (m.home_score == null || m.away_score == null) return null;
  if (m.home_score > m.away_score) return m.home_team_id;
  if (m.away_score > m.home_score) return m.away_team_id;
  // Empate (penales): el ganador es quien avanzó a la siguiente llave del maestro.
  const w = "W:" + m.bracket_code;
  const d = matches.find((x) => x.home_source === w || x.away_source === w);
  if (d) return d.home_source === w ? d.home_team_id : d.away_team_id;
  return null; // partido terminal (3er puesto / final) en empate → no derivable
}

async function syncClient(c, mMatches, teamName) {
  console.log(`\n=== Cliente: ${c.nombre} ===`);
  const cli = admin(c);

  // Chequeo de seguridad: debe ser réplica idéntica (mismos equipos por ID).
  const cTeams = await readTeams(cli);
  const mismatch =
    cTeams.length !== teamName.size ||
    cTeams.some((t) => teamName.get(t.id) !== t.name);
  if (mismatch) {
    console.error("  ✖ Los equipos no coinciden con el maestro (no es réplica idéntica). Se omite.");
    return;
  }

  // 1) Copiar equipos de Dieciseisavos (resultado de la generación del cuadro).
  const r32 = mMatches.filter(
    (m) => m.phase === "round_of_32" && m.home_team_id && m.away_team_id
  );
  for (const m of r32) {
    if (DRY) {
      console.log(`  [dry] R32 ${m.bracket_code}: ${m.home_team_id} vs ${m.away_team_id}`);
      continue;
    }
    const { error } = await cli
      .from("matches")
      .update({ home_team_id: m.home_team_id, away_team_id: m.away_team_id })
      .eq("bracket_code", m.bracket_code);
    if (error) console.error(`  ✖ R32 ${m.bracket_code}: ${error.message}`);
  }

  // 2) Resultados de grupos.
  const grupos = mMatches.filter((m) => m.phase === "group" && m.status === "finished");
  for (const m of grupos) {
    if (DRY) {
      console.log(`  [dry] grupo id=${m.id}: ${m.home_score}-${m.away_score}`);
      continue;
    }
    const { error } = await cli.rpc("set_match_result", {
      p_match_id: m.id,
      p_home_score: m.home_score,
      p_away_score: m.away_score,
    });
    if (error) console.error(`  ✖ grupo id=${m.id}: ${error.message}`);
  }

  // 3) Resultados de eliminatoria, en orden de bracket (para que avancen los ganadores).
  const ko = mMatches
    .filter((m) => m.phase !== "group" && m.status === "finished")
    .sort((a, b) => Number(a.bracket_code) - Number(b.bracket_code));
  for (const m of ko) {
    const winner = deriveWinner(m, mMatches);
    if (!winner) {
      console.warn(
        `  ⚠ ${m.bracket_code}: empate sin ganador derivable (ingrésalo manual en el cliente).`
      );
      continue;
    }
    if (DRY) {
      console.log(`  [dry] KO ${m.bracket_code}: ${m.home_score}-${m.away_score} clasifica=${winner}`);
      continue;
    }
    const { error } = await cli.rpc("set_knockout_result", {
      p_match_id: m.id,
      p_home: m.home_score,
      p_away: m.away_score,
      p_winner_team_id: winner,
    });
    if (error) console.error(`  ✖ KO ${m.bracket_code}: ${error.message}`);
  }

  console.log(`  ✓ ${c.nombre} sincronizado.`);
}

async function main() {
  console.log(DRY ? "— MODO PRUEBA (dry-run): no escribe nada —" : "— Sincronizando —");
  const master = admin(cfg.master);
  const mMatches = await readMatches(master);
  const mTeams = await readTeams(master);
  const teamName = new Map(mTeams.map((t) => [t.id, t.name]));

  const finished = mMatches.filter((m) => m.status === "finished").length;
  console.log(`Maestro: ${mTeams.length} equipos, ${mMatches.length} partidos, ${finished} finalizados.`);

  for (const c of cfg.clients) {
    try {
      await syncClient(c, mMatches, teamName);
    } catch (e) {
      console.error(`  ✖ Error con ${c.nombre}: ${e.message}`);
    }
  }
  console.log("\nListo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
