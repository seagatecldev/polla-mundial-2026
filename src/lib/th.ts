import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Capa de datos del panel de Talento Humano. Lee las vistas (solo lectura) con
// el service role en el servidor. Si las vistas no existen (p. ej. en la demo),
// devuelve listas vacías sin romper.

export type ThEmpleado = {
  cedula: string;
  nombre: string;
  registrado: boolean;
  correo: string | null;
  registrado_ec: string | null;
  registrado_utc: string | null;
  puntos: number;
  predicciones: number;
};

export type ThPrediccion = {
  cedula: string | null;
  jugador: string;
  local: string | null;
  visitante: string | null;
  marcador_predicho: string;
  clasificado_predicho: string | null;
  puntos: number | null;
  fase: string;
  grupo: string | null;
  fecha_partido: string;
  predicho_ec: string | null;
  actualizado_ec: string | null;
  estado: string;
};

export type ThParticipacion = {
  partido_id: number;
  fase: string;
  grupo: string | null;
  local: string | null;
  visitante: string | null;
  fecha_partido: string;
  num_predicciones: number;
};

// PostgREST limita cada consulta a ~1000 filas (db-max-rows). Para no perder
// datos cuando hay muchas predicciones, paginamos con .range() hasta traerlas
// todas. El tamaño de página (1000) coincide con el tope por petición.
const PAGE_SIZE = 1000;

async function safeSelect<T>(view: string, order?: { col: string; asc?: boolean }): Promise<T[]> {
  try {
    const supabase = createAdminClient();
    const rows: T[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      let q = supabase.from(view).select("*").range(from, from + PAGE_SIZE - 1);
      if (order) q = q.order(order.col, { ascending: order.asc ?? true, nullsFirst: false });
      const { data, error } = await q;
      if (error) return from === 0 ? [] : rows; // primer fallo: vacío; parcial: lo logrado
      const batch = (data ?? []) as T[];
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break; // última página
    }
    return rows;
  } catch {
    return [];
  }
}

export function getThEmpleados() {
  return safeSelect<ThEmpleado>("vista_th_empleados", { col: "registrado_utc", asc: true });
}

export function getThPredicciones() {
  return safeSelect<ThPrediccion>("vista_th_predicciones", { col: "predicho_ec", asc: false });
}

export function getThParticipacion() {
  return safeSelect<ThParticipacion>("vista_th_participacion", { col: "fecha_partido", asc: true });
}
