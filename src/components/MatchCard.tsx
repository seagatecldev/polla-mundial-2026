"use client";

import { useState } from "react";
import { MapPin, Lock, Pencil } from "lucide-react";
import type { Match, Prediction } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Flag } from "@/components/ui/Flag";
import { PredictionForm } from "@/components/PredictionForm";
import { formatMatchDate, hasStarted } from "@/lib/utils";

type Props = {
  match: Match;
  prediction?: Prediction | null;
  /** Si false, no se muestra el botón de predecir (modo invitado/lectura). */
  canPredict?: boolean;
};

export function MatchCard({ match, prediction, canPredict = true }: Props) {
  const [open, setOpen] = useState(false);

  const started = hasStarted(match.match_date) || match.status !== "upcoming";
  const finished = match.status === "finished" && match.home_score != null;
  const editable = canPredict && !started;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Cabecera: fecha + estado */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {formatMatchDate(match.match_date)}
        </span>
        {finished ? (
          <Badge tone="neutral">Finalizado</Badge>
        ) : match.status === "live" ? (
          <Badge tone="danger">● En vivo</Badge>
        ) : started ? (
          <Badge tone="warning">
            <Lock size={11} /> Cerrado
          </Badge>
        ) : (
          <Badge tone="pitch">Abierto</Badge>
        )}
      </div>

      {/* Equipos + marcador real */}
      <div className="flex items-center justify-between gap-2">
        <TeamSide name={match.home_team?.name} flag={match.home_team?.flag_emoji} />
        <div className="flex shrink-0 items-center gap-2 text-2xl font-extrabold tabular-nums">
          {finished ? (
            <>
              <span>{match.home_score}</span>
              <span className="text-gray-300">–</span>
              <span>{match.away_score}</span>
            </>
          ) : (
            <span className="text-base font-medium text-gray-400">vs</span>
          )}
        </div>
        <TeamSide name={match.away_team?.name} flag={match.away_team?.flag_emoji} reverse />
      </div>

      {/* Sede */}
      <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
        <MapPin size={12} />
        <span className="line-clamp-1">
          {match.venue}, {match.city}
        </span>
      </div>

      {/* Predicción del usuario */}
      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
        {prediction ? (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Tu pick: </span>
              <span className="font-bold tabular-nums">
                {prediction.pred_home} – {prediction.pred_away}
              </span>
              {finished && prediction.points_earned != null && (
                <PointsBadge points={prediction.points_earned} />
              )}
            </div>
            {editable && (
              <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
                <Pencil size={14} /> Editar
              </Button>
            )}
          </div>
        ) : editable ? (
          <Button size="sm" fullWidth onClick={() => setOpen(true)}>
            Predecir
          </Button>
        ) : (
          <p className="text-sm text-gray-400">
            {started ? "No predijiste este partido." : "Aún sin predicción."}
          </p>
        )}
      </div>

      {open && (
        <PredictionForm
          match={match}
          initialHome={prediction?.pred_home}
          initialAway={prediction?.pred_away}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function TeamSide({
  name,
  flag,
  reverse = false,
}: {
  name?: string | null;
  flag?: string | null;
  reverse?: boolean;
}) {
  return (
    <div className={`flex flex-1 items-center gap-2 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <Flag name={name} emoji={flag} size={26} />
      <span className="line-clamp-2 text-sm font-semibold leading-tight">
        {name ?? "Por definir"}
      </span>
    </div>
  );
}

function PointsBadge({ points }: { points: number }) {
  if (points === 3) return <Badge tone="gold" className="ml-2">+3 exacto</Badge>;
  if (points > 0) return <Badge tone="success" className="ml-2">+{points}</Badge>;
  return <Badge tone="danger" className="ml-2">+0</Badge>;
}
