import { createClient } from "@/lib/supabase/server";

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
