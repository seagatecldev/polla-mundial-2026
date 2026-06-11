"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { resetPasswordByCedula } from "@/app/actions/auth";
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

  // Recuperación de contraseña por cédula (solo versiones con cédula).
  const [showReset, setShowReset] = useState(false);
  const [resetCedula, setResetCedula] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function doReset() {
    setResetMsg(null);
    setResetBusy(true);
    const res = await resetPasswordByCedula(resetCedula);
    setResetBusy(false);
    if (res.ok) {
      const c = resetCedula.replace(/\D/g, "").padStart(10, "0");
      setIdentifier(c);
      setPassword(c);
      setResetMsg({
        ok: true,
        text: "Listo ✅ Tu contraseña ahora es tu número de cédula. Pulsa Entrar (y cámbiala luego si quieres).",
      });
    } else {
      setResetMsg({ ok: false, text: res.error });
    }
  }

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

      {allowCedula && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setShowReset((v) => !v);
              setResetMsg(null);
            }}
            className="text-sm text-gray-500 hover:text-pitch hover:underline dark:text-gray-400"
          >
            ¿Olvidaste tu contraseña?
          </button>

          {showReset && (
            <div className="mt-2 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Escribe tu cédula y tu contraseña volverá a ser tu número de cédula.
              </p>
              <Input
                name="reset_cedula"
                inputMode="numeric"
                value={resetCedula}
                onChange={(e) => setResetCedula(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Tu número de cédula"
                maxLength={10}
              />
              <Button
                type="button"
                variant="secondary"
                fullWidth
                loading={resetBusy}
                onClick={doReset}
              >
                Restablecer a mi cédula
              </Button>
              {resetMsg && (
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    resetMsg.ok
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-50 text-flame dark:bg-red-900/30"
                  }`}
                >
                  {resetMsg.text}
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
