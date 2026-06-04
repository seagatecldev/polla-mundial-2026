"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Match } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Flag } from "@/components/ui/Flag";
import { formatMatchDate } from "@/lib/utils";
import { upsertPrediction } from "@/app/actions/predictions";
import { useRouter } from "next/navigation";

type Props = {
  match: Match;
  initialHome?: number | null;
  initialAway?: number | null;
  initialWinner?: number | null;
  onClose: () => void;
};

export function PredictionForm({ match, initialHome, initialAway, initialWinner, onClose }: Props) {
  const router = useRouter();
  const [home, setHome] = useState<string>(initialHome != null ? String(initialHome) : "");
  const [away, setAway] = useState<string>(initialAway != null ? String(initialAway) : "");
  const [winnerId, setWinnerId] = useState<number | null>(initialWinner ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isKnockout = match.phase !== "group";

  // Bloquear scroll del fondo mientras la hoja está abierta.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function save() {
    setError(null);
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0) {
      setError("Ingresa un marcador válido para ambos equipos.");
      return;
    }
    if (isKnockout && !winnerId) {
      setError("Elige qué equipo crees que clasifica.");
      return;
    }
    setSaving(true);
    const res = await upsertPrediction(match.id, h, a, isKnockout ? winnerId : null);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative mx-auto w-full max-w-app rounded-t-2xl bg-white p-5 pb-8 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Tu predicción</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatMatchDate(match.match_date)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <ScoreSide
            label={match.home_team?.name ?? "Local"}
            flag={match.home_team?.flag_emoji ?? "🏳️"}
            value={home}
            onChange={setHome}
          />
          <span className="pt-6 text-xl font-bold text-gray-300">–</span>
          <ScoreSide
            label={match.away_team?.name ?? "Visitante"}
            flag={match.away_team?.flag_emoji ?? "🏳️"}
            value={away}
            onChange={setAway}
            reverse
          />
        </div>

        {isKnockout && (
          <div className="mt-5">
            <p className="mb-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
              ¿Quién clasifica? <span className="text-xs font-normal text-gold">(+2 pts)</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWinnerId(match.home_team_id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-sm font-semibold transition ${
                  winnerId === match.home_team_id
                    ? "border-pitch bg-pitch text-white"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <span className="text-lg">{match.home_team?.flag_emoji}</span>
                <span className="line-clamp-1">{match.home_team?.name}</span>
              </button>
              <button
                type="button"
                onClick={() => setWinnerId(match.away_team_id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-sm font-semibold transition ${
                  winnerId === match.away_team_id
                    ? "border-pitch bg-pitch text-white"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <span className="text-lg">{match.away_team?.flag_emoji}</span>
                <span className="line-clamp-1">{match.away_team?.name}</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-flame dark:bg-red-900/30">
            {error}
          </p>
        )}

        <Button onClick={save} loading={saving} fullWidth size="lg" className="mt-5">
          Guardar predicción
        </Button>
      </div>
    </div>
  );
}

function ScoreSide({
  label,
  flag,
  value,
  onChange,
  reverse = false,
}: {
  label: string;
  flag: string;
  value: string;
  onChange: (v: string) => void;
  reverse?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <Flag name={label} emoji={flag} size={36} />
        <span className="line-clamp-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300">
          {label}
        </span>
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="h-16 w-16 rounded-xl border-2 border-gray-200 text-center text-2xl font-bold focus:border-pitch focus:outline-none dark:border-gray-700 dark:bg-gray-800"
        aria-label={`Goles ${label}`}
      />
    </div>
  );
}
