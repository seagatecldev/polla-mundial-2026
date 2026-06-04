"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { Match } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Flag } from "@/components/ui/Flag";
import { formatMatchDate } from "@/lib/utils";

export function AdminMatchRow({ match }: { match: Match }) {
  const router = useRouter();
  const [home, setHome] = useState(match.home_score != null ? String(match.home_score) : "");
  const [away, setAway] = useState(match.away_score != null ? String(match.away_score) : "");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isKnockout = match.phase !== "group";
  const h0 = parseInt(home, 10);
  const a0 = parseInt(away, 10);
  // En eliminatoria, si el marcador es empate, hay que elegir quién avanza (penales).
  const needsWinner =
    isKnockout && !Number.isNaN(h0) && !Number.isNaN(a0) && h0 === a0;

  async function finalize() {
    setMsg(null);
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0) {
      setMsg({ ok: false, text: "Marcador inválido" });
      return;
    }
    if (needsWinner && !winnerId) {
      setMsg({ ok: false, text: "Empate: elige quién avanzó (penales)." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/calcular-puntos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        homeScore: h,
        awayScore: a,
        winnerTeamId: needsWinner ? winnerId : undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMsg({ ok: true, text: `Guardado · ${data.updated} predicciones recalculadas` });
      router.refresh();
    } else {
      setMsg({ ok: false, text: data.error ?? "Error al guardar" });
    }
  }

  async function setStatus(status: "upcoming" | "live" | "finished") {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/calcular-puntos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, status }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      router.refresh();
    } else {
      setMsg({ ok: false, text: data.error ?? "Error" });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{formatMatchDate(match.match_date)}</span>
        <StatusBadge status={match.status} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-1 items-center gap-1.5 truncate text-sm font-semibold">
          <Flag name={match.home_team?.name} emoji={match.home_team?.flag_emoji} size={20} />
          <span className="truncate">{match.home_team?.name ?? "—"}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={99}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="h-10 w-12 rounded-lg border border-gray-300 text-center font-bold dark:border-gray-700 dark:bg-gray-800"
            aria-label="Goles local"
          />
          <span className="text-gray-300">–</span>
          <input
            type="number"
            min={0}
            max={99}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="h-10 w-12 rounded-lg border border-gray-300 text-center font-bold dark:border-gray-700 dark:bg-gray-800"
            aria-label="Goles visitante"
          />
        </div>
        <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-right text-sm font-semibold">
          <span className="truncate">{match.away_team?.name ?? "—"}</span>
          <Flag name={match.away_team?.name} emoji={match.away_team?.flag_emoji} size={20} />
        </span>
      </div>

      {needsWinner && (
        <div className="mt-3 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
          <p className="mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Empate — ¿quién avanzó (penales)?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWinnerId(match.home_team_id)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium ${
                winnerId === match.home_team_id
                  ? "border-pitch bg-pitch text-white"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              {match.home_team?.flag_emoji} {match.home_team?.name}
            </button>
            <button
              type="button"
              onClick={() => setWinnerId(match.away_team_id)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium ${
                winnerId === match.away_team_id
                  ? "border-pitch bg-pitch text-white"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              {match.away_team?.flag_emoji} {match.away_team?.name}
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={finalize} loading={busy} className="flex-1">
          <Check size={15} /> Guardar resultado
        </Button>
        {match.status === "upcoming" && (
          <Button size="sm" variant="secondary" onClick={() => setStatus("live")} disabled={busy}>
            En vivo
          </Button>
        )}
        {match.status === "live" && (
          <Button size="sm" variant="ghost" onClick={() => setStatus("upcoming")} disabled={busy}>
            Reabrir
          </Button>
        )}
      </div>

      {msg && (
        <p className={`mt-2 text-xs ${msg.ok ? "text-green-600" : "text-flame"}`}>{msg.text}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Match["status"] }) {
  if (status === "finished") return <Badge tone="neutral">Finalizado</Badge>;
  if (status === "live") return <Badge tone="danger">● En vivo</Badge>;
  return <Badge tone="pitch">Próximo</Badge>;
}
