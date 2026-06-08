"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

const allowCedula = config.features.requireCedula;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [identifier, setIdentifier] = useState(config.demo.email);
  const [password, setPassword] = useState(config.demo.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDemo = Boolean(config.demo.email && config.demo.password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    // Si la versión usa cédula y el usuario escribió solo dígitos, resolvemos
    // la cédula a su correo antes de iniciar sesión.
    let email = identifier.trim();
    const looksLikeCedula = /^\d{8,10}$/.test(email);
    if (allowCedula && looksLikeCedula) {
      const { data, error: rpcErr } = await supabase.rpc("email_for_cedula", {
        p_cedula: email,
      });
      if (rpcErr || !data) {
        setLoading(false);
        setError("No encontramos una cuenta con esa cédula.");
        return;
      }
      email = data as string;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Debes confirmar tu correo antes de entrar. Revisa tu bandeja.");
      } else {
        setError(
          allowCedula
            ? "Datos incorrectos. Revisa tu correo/cédula y contraseña."
            : "Correo o contraseña incorrectos."
        );
      }
      return;
    }
    router.replace(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label={allowCedula ? "Correo o número de cédula" : "Correo electrónico"}
        type={allowCedula ? "text" : "email"}
        name="identifier"
        autoComplete={allowCedula ? "username" : "email"}
        required
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder={allowCedula ? "tu@correo.com o tu cédula" : "tu@correo.com"}
      />
      <PasswordInput
        label="Contraseña"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-flame dark:bg-red-900/30">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Entrar
      </Button>
      {isDemo && (
        <p className="rounded-lg bg-pitch/5 px-3 py-2 text-center text-xs text-gray-500 dark:bg-pitch/10 dark:text-gray-400">
          Cuenta de demostración — solo presiona <span className="font-semibold">Entrar</span>.
        </p>
      )}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-pitch hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
