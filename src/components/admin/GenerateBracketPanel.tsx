"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import type { Team } from "@/lib/types";
import type { StandingRow } from "@/lib/standings";
import {
  defaultPositions,
  defaultQualifiedThirdIds,
  rankThirds,
  validateResolution,
  type GroupPositions,
} from "@/lib/qualification";
import { suggestThirdsAssignment } from "@/lib/bracket";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Flag } from "@/components/ui/Flag";
import { generateKnockout } from "@/app/actions/admin";

export type ThirdSlot = { code: string; rival: string; eligible: string[] };
export type GroupTable = { group: string; rows: StandingRow[] };

type Props = {
  complete: boolean;
  alreadyGenerated: boolean;
  groupTables: GroupTable[];
  slots: ThirdSlot[];
  warnings: string[];
};

export function GenerateBracketPanel({
  complete,
  alreadyGenerated,
  groupTables,
  slots,
  warnings,
}: Props) {
  const router = useRouter();
  const tablesMap = useMemo(
    () => Object.fromEntries(groupTables.map((t) => [t.group, t.rows])) as Record<string, StandingRow[]>,
    [groupTables]
  );

  // Posiciones editables (1º/2º/3º por grupo). Default = orden actual.
  const [positions, setPositions] = useState<GroupPositions[]>(() => defaultPositions(tablesMap));
  const [editing, setEditing] = useState<Set<string>>(new Set());

  // Asignación de terceros a llaves. Default = sugerencia con los 8 mejores.
  const [assignment, setAssignment] = useState<Record<string, number>>(() => {
    const dp = defaultPositions(tablesMap);
    const top8 = defaultQualifiedThirdIds(dp, tablesMap);
    const groupByTeam = new Map(dp.map((p) => [p.thirdId, p.group]));
    return suggestThirdsAssignment(
      slots,
      top8.map((id) => ({ teamId: id, group: groupByTeam.get(id) as string }))
    );
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Terceros disponibles (los 12, según el 3º elegido de cada grupo), ordenados.
  const rankedThirds = useMemo(() => rankThirds(positions, tablesMap), [positions, tablesMap]);
  const thirdIds = useMemo(() => new Set(rankedThirds.map((t) => t.teamId)), [rankedThirds]);

  // Si cambia quién es 3º, limpiar asignaciones que ya no son terceros válidos.
  useEffect(() => {
    setAssignment((prev) => {
      const next: Record<string, number> = {};
      for (const [code, id] of Object.entries(prev)) if (thirdIds.has(id)) next[code] = id;
      return next;
    });
  }, [thirdIds]);

  const usedIds = Object.values(assignment).filter(Boolean);
  const hasDuplicates = new Set(usedIds).size !== usedIds.length;
  const allAssigned = slots.every((s) => assignment[s.code]);

  const resolution = useMemo(
    () => ({
      positions,
      thirdsAssignment: slots
        .filter((s) => assignment[s.code])
        .map((s) => ({ bracketCode: s.code, teamId: assignment[s.code] })),
    }),
    [positions, assignment, slots]
  );
  const validation = useMemo(() => validateResolution(tablesMap, resolution), [tablesMap, resolution]);
  const canSubmit = complete && allAssigned && !hasDuplicates && validation.ok;

  function setPos(group: string, slot: "firstId" | "secondId" | "thirdId", teamId: number) {
    setPositions((prev) => prev.map((p) => (p.group === group ? { ...p, [slot]: teamId } : p)));
  }
  function toggleEdit(group: string) {
    setEditing((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  async function submit() {
    setMsg(null);
    if (!validation.ok) {
      setMsg({ ok: false, text: validation.error });
      return;
    }
    if (!allAssigned || hasDuplicates) {
      setMsg({ ok: false, text: "Asigna todos los terceros sin repetir." });
      return;
    }
    if (alreadyGenerated) {
      const ok = window.confirm(
        "Regenerar reinicia TODO el cuadro: borra los resultados y predicciones de eliminatoria ya cargados y recalcula el ranking. ¿Continuar?"
      );
      if (!ok) return;
    }
    setBusy(true);
    const res = await generateKnockout(resolution);
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: res.message });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <section className="rounded-2xl border border-pitch/30 bg-pitch/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy size={18} className="text-pitch" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-pitch">
          Generar eliminatorias
        </h2>
      </div>

      {!complete ? (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30">
          <AlertTriangle size={16} />
          Aún faltan resultados de la fase de grupos. Termina todos los partidos de grupo para
          generar el cuadro.
        </p>
      ) : (
        <div className="space-y-4">
          {alreadyGenerated && (
            <p className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/30">
              <CheckCircle2 size={14} />
              El cuadro ya fue generado. Regenerar reinicia TODO el cuadro (borra resultados y
              predicciones de eliminatoria).
            </p>
          )}

          {warnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30">
              <p className="mb-1 font-semibold">Empates a revisar (puedes ajustar el orden abajo):</p>
              <ul className="list-disc pl-4">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Posiciones por grupo (1º/2º/3º), editables */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">
              Posiciones por grupo (1º, 2º y 3º) — edita si hubo empate
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {positions.map((p) => {
                const rows = tablesMap[p.group] ?? [];
                const teamById = new Map(rows.map((r) => [r.team.id, r.team]));
                const isEditing = editing.has(p.group);
                const tie = warnings.some((w) => w.startsWith(`Grupo ${p.group}:`));
                return (
                  <div
                    key={p.group}
                    className={`rounded-lg border p-2 text-xs ${
                      tie ? "border-amber-300 bg-amber-50/40 dark:bg-amber-900/10" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-bold">Grupo {p.group}</span>
                      <button
                        type="button"
                        onClick={() => toggleEdit(p.group)}
                        className="flex items-center gap-1 text-pitch hover:underline"
                      >
                        <Pencil size={11} /> {isEditing ? "Listo" : "Editar"}
                      </button>
                    </div>
                    {isEditing ? (
                      <div className="space-y-1">
                        {(["firstId", "secondId", "thirdId"] as const).map((slot, i) => (
                          <div key={slot} className="flex items-center gap-1.5">
                            <Badge tone={i === 0 ? "gold" : i === 1 ? "neutral" : "pitch"}>
                              {i + 1}º
                            </Badge>
                            <select
                              value={p[slot]}
                              onChange={(e) => setPos(p.group, slot, Number(e.target.value))}
                              className="flex-1 rounded border border-gray-300 bg-white px-1.5 py-1 dark:border-gray-700 dark:bg-gray-800"
                            >
                              {rows.map((r) => (
                                <option key={r.team.id} value={r.team.id}>
                                  {r.team.flag_emoji} {r.team.name} ({r.points} pts, DG {r.gd})
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {(["firstId", "secondId", "thirdId"] as const).map((slot, i) => {
                          const t = teamById.get(p[slot]);
                          return (
                            <div key={slot} className="flex items-center gap-1.5">
                              <span className="w-4 text-gray-400">{i + 1}º</span>
                              {t && <Flag name={t.name} emoji={t.flag_emoji} size={14} />}
                              <span className="truncate">{t?.name ?? "—"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asignar terceros a llaves (opciones = los 12 terceros elegibles) */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">
              Asignar terceros clasificados (cada llave solo admite sus grupos elegibles)
            </p>
            <div className="space-y-1.5">
              {slots.map((slot) => {
                const options = rankedThirds.filter(
                  (t) =>
                    slot.eligible.includes(t.group) &&
                    (!usedIds.includes(t.teamId) || assignment[slot.code] === t.teamId)
                );
                return (
                  <div key={slot.code} className="flex items-center gap-2">
                    <Badge tone="pitch">{slot.rival} vs</Badge>
                    <select
                      value={assignment[slot.code] ?? ""}
                      onChange={(e) =>
                        setAssignment((prev) => ({ ...prev, [slot.code]: Number(e.target.value) }))
                      }
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="">— tercero (grupos {slot.eligible.join("/")}) —</option>
                      {options.map((t) => (
                        <option key={t.teamId} value={t.teamId}>
                          {t.team.flag_emoji} {t.team.name} (3{t.group} · {t.row.points} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            {hasDuplicates && <p className="mt-1 text-xs text-flame">Hay terceros repetidos.</p>}
            {!validation.ok && (
              <p className="mt-1 text-xs text-flame">{validation.error}</p>
            )}
          </div>

          <Button onClick={submit} loading={busy} disabled={!canSubmit} fullWidth>
            {alreadyGenerated ? "Regenerar cuadro" : "Generar cuadro"}
          </Button>

          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-600" : "text-flame"}`}>{msg.text}</p>
          )}
        </div>
      )}
    </section>
  );
}
