import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-gray-200 bg-pitch px-4 py-3 text-white dark:border-gray-800">
        <Link href="/" className="rounded-full p-1.5 transition hover:bg-white/10" aria-label="Volver">
          <ArrowLeft size={20} />
        </Link>
        <Shield size={18} />
        <h1 className="text-base font-bold">Panel de administración</h1>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
