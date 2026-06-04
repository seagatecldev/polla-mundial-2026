"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-flame dark:hover:bg-gray-800"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      <LogOut size={20} />
    </button>
  );
}
