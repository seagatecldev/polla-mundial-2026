import { AdminMatchRow } from "@/components/admin/AdminMatchRow";
import { getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Partidos pendientes (upcoming/live) primero; los finalizados al final por si hay que corregir.
  const [upcoming, live, finished] = await Promise.all([
    getMatches({ status: "upcoming" }),
    getMatches({ status: "live" }),
    getMatches({ status: "finished" }),
  ]);

  const pending = [...live, ...upcoming];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Ingresa el marcador final de cada partido. Al guardar se recalculan automáticamente
        los puntos de todas las predicciones y el ranking.
      </p>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
          Por jugar / en vivo ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((m) => (
              <AdminMatchRow key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hay partidos pendientes.</p>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            Finalizados ({finished.length}) — editar si hace falta
          </h2>
          <div className="space-y-3">
            {finished.map((m) => (
              <AdminMatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
