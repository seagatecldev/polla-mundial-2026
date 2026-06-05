"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Flag } from "@/components/ui/Flag";
import { generateKnockout } from "@/app/actions/admin";

export type ThirdOption = { group: string; team: Team; qualified: boolean };

type Props = {
  complete: boolean;
  alreadyGenerated: boolean;
  winners: { group: string; team: Team | null }[];
  runners: { group: string; team: Team | null }[];
  thirds: ThirdOption[];
  warnings: string[];
};

// Cada slot de tercero (K7..K14) y contra quién juega (solo para mostrar).
const THIRD_SLOTS: { code: string; vs: string }[] = [
  { code: "K7", vs: "1B" },
  { code: "K8", vs: "1D" },
  { code: "K9", vs: "1F" },
  { code: "K10", vs: "1H" },
  { code: "K11", vs: "1J" },
  { code: "K12", vs: "1L" },
  { code: "K13", vs: "2A" },
  { code: "K14", vs: "2C" },
];

export function GenerateBracketPanel({
  complete,
  alreadyGenerated,
  winners,
  runners,
  thirds,
  warnings,
}: Props) {
  const router = useRouter();
  const qualifiedThirds = thirds.filter((t) => t.qualified);

  // Asignación por defecto: slot i -> i-ésimo tercero clasificado.
  const [assignment, setAssignment] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    THIRD_SLOTS.forEach((s, i) => {
      const t = qualifiedThirds[i];
      if (t) init[s.code] = t.team.id;
    });
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const usedIds = Object.values(assignment);
  const hasDuplicates = new Set(usedIds).size !== usedIds.length;
  const allAssigned = THIRD_SLOTS.every((s) => assignment[s.code]);

  async function submit() {
    setMsg(null);
    if (!allAssigned || hasDuplicates) {
      setMsg({ ok: false, text: "Asigna los 8 terceros sin repetir." });
      return;
    }
    if (alreadyGenerated) {
      const ok = window.confirm(
        "Regenerar reinicia TODO el cuadro: borra los resultados y predicciones de eliminatoria ya cargados y recalcula el ranking. ¿Continuar?"
      );
      if (!ok) return;
    }
    setBusy(true);
    const payload = THIRD_SLOTS.map((s) => ({ bracketCode: s.code, teamId: assignment[s.code] }));
    const res = await generateKnockout(payload);
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
              <p className="mb-1 font-semibold">Empates a revisar:</p>
              <ul className="list-disc pl-4">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Clasificados 1º/2º (solo lectura) */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">
              Clasificados directos (1º y 2º)
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {winners.map((w) => (
                <div key={w.group} className="flex items-center gap-1.5">
                  <Badge tone="gold">1{w.group}</Badge>
                  {w.team && <Flag name={w.team.name} emoji={w.team.flag_emoji} size={16} />}
                  <span className="truncate">{w.team?.name ?? "—"}</span>
                </div>
              ))}
              {runners.map((r) => (
                <div key={r.group} className="flex items-center gap-1.5">
                  <Badge tone="neutral">2{r.group}</Badge>
                  {r.team && <Flag name={r.team.name} emoji={r.team.flag_emoji} size={16} />}
                  <span className="truncate">{r.team?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Asignación de los 8 mejores terceros */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">
              Asignar 8 mejores terceros a sus llaves
            </p>
            <div className="space-y-1.5">
              {THIRD_SLOTS.map((slot) => (
                <div key={slot.code} className="flex items-center gap-2">
                  <Badge tone="pitch">{slot.vs} vs</Badge>
                  <select
                    value={assignment[slot.code] ?? ""}
                    onChange={(e) =>
                      setAssignment((prev) => ({ ...prev, [slot.code]: Number(e.target.value) }))
                    }
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="">— elegir tercero —</option>
                    {qualifiedThirds.map((t) => (
                      <option key={t.team.id} value={t.team.id}>
                        {t.team.flag_emoji} {t.team.name} (3{t.group})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {hasDuplicates && (
              <p className="mt-1 text-xs text-flame">Hay terceros repetidos.</p>
            )}
          </div>

          <Button onClick={submit} loading={busy} disabled={!allAssigned || hasDuplicates} fullWidth>
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
