"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ResetResult = { ok: true } | { ok: false; error: string };

/**
 * Recuperación de contraseña SIN email (versiones con cédula): el usuario
 * prueba su identidad con la cédula y su contraseña se restablece a su propia
 * cédula. La seguridad real (encontrar la cuenta) usa el service role en el
 * servidor; no se expone ningún dato. No toca nada del torneo.
 */
export async function resetPasswordByCedula(cedula: string): Promise<ResetResult> {
  const norm = (cedula ?? "").replace(/\D/g, "").padStart(10, "0");
  if (norm.replace(/0/g, "").length === 0) {
    return { ok: false, error: "Ingresa tu número de cédula." };
  }

  const supabase = createAdminClient();

  const { data: row, error: e1 } = await supabase
    .from("allowed_employees")
    .select("claimed_by")
    .eq("cedula", norm)
    .maybeSingle();

  if (e1) return { ok: false, error: "No se pudo verificar. Intenta de nuevo." };
  if (!row) return { ok: false, error: "Esa cédula no está en la lista de empleados." };
  if (!row.claimed_by) {
    return { ok: false, error: "Esa cédula aún no tiene una cuenta. Primero regístrate." };
  }

  const { error: e2 } = await supabase.auth.admin.updateUserById(row.claimed_by as string, {
    password: norm,
  });
  if (e2) return { ok: false, error: "No se pudo restablecer la contraseña. Intenta de nuevo." };

  return { ok: true };
}
