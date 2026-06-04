"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (displayName.trim().length < 2) {
      setError("Tu nombre debe tener al menos 2 caracteres.");
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
      options: { data: { display_name: displayName.trim() } },
    });

    if (error) {
      setLoading(false);
      setError(
        error.message.toLowerCase().includes("already registered")
          ? "Ese correo ya está registrado. Inicia sesión."
          : "No se pudo crear la cuenta. Inténtalo de nuevo."
      );
      return;
    }

    // Si la confirmación de email está activa, no hay sesión todavía.
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
      <Input
        label="Nombre para mostrar"
        name="display_name"
        autoComplete="name"
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Tu nombre o apodo"
        maxLength={40}
      />
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
      <Button type="submit" fullWidth size="lg" loading={loading}>
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
