"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import type { Match, Prediction } from "@/lib/types";

const PER_PAGE = 12;

/**
 * Lista de partidos paginada en el cliente: solo renderiza una página a la vez
 * (las MatchCard son interactivas), así no se cargan todas de golpe. Al cambiar
 * de pestaña/ruta el componente se remonta y vuelve a la página 1.
 */
export function PaginatedMatches({
  matches,
  predMap = {},
  canPredict = true,
  perPage = PER_PAGE,
}: {
  matches: Match[];
  predMap?: Record<number, Prediction | null>;
  canPredict?: boolean;
  perPage?: number;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(matches.length / perPage);
  const start = page * perPage;
  const slice = matches.slice(start, start + perPage);

  function go(next: number) {
    setPage(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 xl:grid-cols-3">
        {slice.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            prediction={predMap[m.id] ?? null}
            canPredict={canPredict}
          />
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
          <span className="text-xs text-gray-400">
            Página {page + 1} de {pages} · {matches.length} partidos
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => go(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-medium text-gray-600 transition enabled:hover:border-pitch/40 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              onClick={() => go(Math.min(pages - 1, page + 1))}
              disabled={page >= pages - 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-medium text-gray-600 transition enabled:hover:border-pitch/40 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
