import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="app-shell items-center justify-center px-6 text-center">
      <div className="text-6xl">⚽</div>
      <h1 className="mt-4 text-2xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Esta jugada salió por la línea de fondo. Volvamos al campo.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-pitch px-5 py-2.5 font-semibold text-white transition hover:bg-pitch-dark"
      >
        <Home size={18} /> Ir al inicio
      </Link>
    </div>
  );
}
