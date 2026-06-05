"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type CedulaStatus = "idle" | "checking" | "ok" | "used" | "notfound" | "error";

export default function RegisterPage() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [empName, setEmpName] = useState<string | null>(null);
  const [cedulaStatus, setCedulaStatus] = useState<CedulaStatus>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Solo dígitos en la cédula; al cambiarla se reinicia la verificación.
  function onCedulaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setCedula(digits);
    setEmpName(null);
    setCedulaStatus("idle");
    setError(null);
  }

  // Consulta la cédula en la lista de empleados al salir del campo.
  async function checkCedula() {
    if (cedula.length < 9) {
      setCedulaStatus("idle");
      return;
    }
    setCedulaStatus("checking");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("lookup_employee", { p_cedula: cedula });
    if (error) {
      setCedulaStatus("error");
      return;
    }
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!row) {
      setEmpName(null);
      setCedulaStatus("notfound");
    } else if (!row.available) {
      setEmpName(row.full_name);
      setCedulaStatus("used");
    } else {
      setEmpName(row.full_name);
      setCedulaStatus("ok");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (cedulaStatus !== "ok") {
      setError("Primero verifica tu número de cédula.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { cedula } },
    });

    if (error) {
      setLoading(false);
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered")) {
        setError("Ese correo ya está registrado. Inicia sesión.");
      } else if (msg.includes("ya_usada")) {
        setError("Esa cédula ya tiene una cuenta.");
      } else if (msg.includes("invalida") || msg.includes("requerida")) {
        setError("Tu cédula no está en la lista de empleados.");
      } else {
        setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
      }
      return;
    }

    if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setLoading(false);
      setInfo("¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Input
          label="Número de cédula"
          name="cedula"
          inputMode="numeric"
          autoComplete="off"
          required
          value={cedula}
          onChange={onCedulaChange}
          onBlur={checkCedula}
          placeholder="Ej. 0927430587"
          maxLength={10}
          error={
            cedulaStatus === "notfound"
              ? "Cédula no está en la lista de empleados. Verifica el número."
              : cedulaStatus === "used"
              ? "Esta cédula ya tiene una cuenta registrada."
              : cedulaStatus === "error"
              ? "No se pudo verificar. Revisa tu conexión e inténtalo de nuevo."
              : undefined
          }
        />
        {/* Estado de la verificación */}
        {cedulaStatus === "checking" && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Verificando…
          </p>
        )}
        {cedulaStatus === "ok" && empName && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 size={15} /> {empName}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Ingresa tu cédula tal como aparece en tu documento (10 dígitos).
        </p>
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
      />
      <Input
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mínimo 6 caracteres"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-flame dark:bg-red-900/30">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {info}
        </p>
      )}
      <Button type="submit" fullWidth size="lg" loading={loading} disabled={cedulaStatus !== "ok"}>
        Crear cuenta
      </Button>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-pitch hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
