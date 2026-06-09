"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Search } from "lucide-react";
import type { ThEmpleado, ThPrediccion, ThParticipacion } from "@/lib/th";

type Props = {
  empleados: ThEmpleado[];
  predicciones: ThPrediccion[];
  participacion: ThParticipacion[];
};

type TabKey = "faltantes" | "registrados" | "predicciones" | "partidos";

/** "2026-06-06T15:22:00" → "2026-06-06 15:22" */
function fhEc(v: string | null): string {
  if (!v) return "";
  return v.replace("T", " ").slice(0, 16);
}

function exportXlsx(rows: Record<string, unknown>[], filename: string, sheet: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, filename);
}

export function ThDashboard({ empleados, predicciones, participacion }: Props) {
  const [tab, setTab] = useState<TabKey>("faltantes");
  const [q, setQ] = useState("");

  const registrados = useMemo(() => empleados.filter((e) => e.registrado), [empleados]);
  const faltantes = useMemo(() => empleados.filter((e) => !e.registrado), [empleados]);
  const conPredicciones = useMemo(
    () => empleados.filter((e) => e.predicciones > 0).length,
    [empleados]
  );
  const cobertura = empleados.length
    ? Math.round((registrados.length / empleados.length) * 100)
    : 0;

  const needle = q.trim().toLowerCase();
  const match = (...vals: (string | null | undefined)[]) =>
    !needle || vals.some((v) => (v ?? "").toLowerCase().includes(needle));

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Empleados" value={empleados.length} />
        <Stat label="Registrados" value={registrados.length} highlight />
        <Stat label="Faltan" value={faltantes.length} />
        <Stat label="Cobertura" value={`${cobertura}%`} />
        <Stat label="Ya predijeron" value={conPredicciones} />
        <Stat label="Predicciones" value={predicciones.length} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Tab k="faltantes" tab={tab} setTab={setTab}>Faltan por registrarse ({faltantes.length})</Tab>
        <Tab k="registrados" tab={tab} setTab={setTab}>Registrados ({registrados.length})</Tab>
        <Tab k="predicciones" tab={tab} setTab={setTab}>Predicciones ({predicciones.length})</Tab>
        <Tab k="partidos" tab={tab} setTab={setTab}>Por partido ({participacion.length})</Tab>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <Search size={16} className="text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, cédula o equipo…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {/* === FALTANTES === */}
      {tab === "faltantes" && (
        <Section
          title="Colaboradores que faltan por registrarse"
          onExport={() =>
            exportXlsx(
              faltantes.map((e) => ({ Cédula: e.cedula, Nombre: e.nombre })),
              "faltan_por_registrarse.xlsx",
              "Faltantes"
            )
          }
        >
          <Table head={["Cédula", "Nombre"]}>
            {faltantes
              .filter((e) => match(e.cedula, e.nombre))
              .map((e) => (
                <tr key={e.cedula} className="border-b border-gray-100 dark:border-gray-800">
                  <Td>{e.cedula}</Td>
                  <Td>{e.nombre}</Td>
                </tr>
              ))}
          </Table>
        </Section>
      )}

      {/* === REGISTRADOS (orden de registro, para sorteos) === */}
      {tab === "registrados" && (
        <Section
          title="Registrados — en orden de registro (hora Ecuador)"
          subtitle="Útil para sorteos de los primeros en registrarse."
          onExport={() =>
            exportXlsx(
              registrados.map((e, i) => ({
                "#": i + 1,
                Nombre: e.nombre,
                Cédula: e.cedula,
                Correo: e.correo ?? "",
                "Registrado (Ecuador)": fhEc(e.registrado_ec),
                Predicciones: e.predicciones,
                Puntos: e.puntos,
              })),
              "registrados.xlsx",
              "Registrados"
            )
          }
        >
          <Table head={["#", "Nombre", "Cédula", "Correo", "Registrado", "Predic.", "Pts"]}>
            {registrados
              .filter((e) => match(e.cedula, e.nombre, e.correo))
              .map((e, i) => (
                <tr key={e.cedula} className="border-b border-gray-100 dark:border-gray-800">
                  <Td>{i + 1}</Td>
                  <Td>{e.nombre}</Td>
                  <Td>{e.cedula}</Td>
                  <Td>{e.correo}</Td>
                  <Td>{fhEc(e.registrado_ec)}</Td>
                  <Td>{e.predicciones}</Td>
                  <Td>{e.puntos}</Td>
                </tr>
              ))}
          </Table>
        </Section>
      )}

      {/* === PREDICCIONES (trazabilidad) === */}
      {tab === "predicciones" && (
        <Section
          title="Trazabilidad de predicciones"
          onExport={() =>
            exportXlsx(
              predicciones.map((p) => ({
                Jugador: p.jugador,
                Cédula: p.cedula ?? "",
                Local: p.local ?? "",
                Visitante: p.visitante ?? "",
                "Marcador predicho": p.marcador_predicho,
                Clasificado: p.clasificado_predicho ?? "",
                Fase: p.fase,
                Estado: p.estado,
                Puntos: p.puntos ?? "",
                "Predicho (Ecuador)": fhEc(p.predicho_ec),
              })),
              "predicciones.xlsx",
              "Predicciones"
            )
          }
        >
          <Table
            head={["Jugador", "Partido", "Pick", "Clasif.", "Fase", "Predicho (Ecuador)"]}
          >
            {predicciones
              .filter((p) => match(p.jugador, p.cedula, p.local, p.visitante))
              .map((p, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <Td>{p.jugador}</Td>
                  <Td>{(p.local ?? "?") + " vs " + (p.visitante ?? "?")}</Td>
                  <Td>{p.marcador_predicho}</Td>
                  <Td>{p.clasificado_predicho ?? "—"}</Td>
                  <Td>{p.fase}</Td>
                  <Td>{fhEc(p.predicho_ec)}</Td>
                </tr>
              ))}
          </Table>
        </Section>
      )}

      {/* === POR PARTIDO === */}
      {tab === "partidos" && (
        <Section
          title="Participación por partido"
          onExport={() =>
            exportXlsx(
              participacion.map((m) => ({
                Fase: m.fase,
                Grupo: m.grupo ?? "",
                Local: m.local ?? "",
                Visitante: m.visitante ?? "",
                Predicciones: m.num_predicciones,
              })),
              "participacion_por_partido.xlsx",
              "Por partido"
            )
          }
        >
          <Table head={["Partido", "Fase", "Grupo", "Predicciones"]}>
            {participacion
              .filter((m) => match(m.local, m.visitante, m.fase))
              .map((m) => (
                <tr key={m.partido_id} className="border-b border-gray-100 dark:border-gray-800">
                  <Td>{(m.local ?? "?") + " vs " + (m.visitante ?? "?")}</Td>
                  <Td>{m.fase}</Td>
                  <Td>{m.grupo ?? "—"}</Td>
                  <Td>{m.num_predicciones}</Td>
                </tr>
              ))}
          </Table>
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 text-center ${
        highlight ? "border-pitch/30 bg-pitch/5" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <p className={`text-2xl font-extrabold tabular-nums ${highlight ? "text-pitch dark:text-pitch-light" : ""}`}>
        {value}
      </p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  );
}

function Tab({
  k,
  tab,
  setTab,
  children,
}: {
  k: TabKey;
  tab: TabKey;
  setTab: (t: TabKey) => void;
  children: React.ReactNode;
}) {
  const active = tab === k;
  return (
    <button
      onClick={() => setTab(k)}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-pitch text-white"
          : "border border-gray-200 bg-white text-gray-600 hover:border-pitch/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  subtitle,
  onExport,
  children,
}: {
  title: string;
  subtitle?: string;
  onExport: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <button
          onClick={onExport}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-pitch px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pitch-dark"
        >
          <Download size={14} /> Descargar Excel
        </button>
      </div>
      <div className="no-scrollbar overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[480px] text-left text-sm">
      <thead>
        <tr className="text-xs uppercase text-gray-400">
          {head.map((h) => (
            <th key={h} className="px-2 py-2 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-2 align-top">{children}</td>;
}
