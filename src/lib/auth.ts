import { createClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";

/** Verifica que el usuario actual sea el administrador. Devuelve el user o null. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return null;
  }
  return user;
}

/** True si el correo pertenece a Talento Humano (o es el admin). */
export function isThEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return config.thEmails.includes(e) || e === (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();
}

/** Verifica que el usuario actual tenga acceso al panel de TH. Devuelve el user o null. */
export async function requireTH() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isThEmail(user.email)) return null;
  return user;
}
