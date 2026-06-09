import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { requireTH } from "@/lib/auth";

export default async function ThLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTH();
  if (!user) redirect("/");

  return (
    <div className="app-shell lg:max-w-none">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-gray-200 bg-pitch px-4 py-3 text-white dark:border-gray-800">
        <Link href="/" className="rounded-full p-1.5 transition hover:bg-white/10" aria-label="Volver">
          <ArrowLeft size={20} />
        </Link>
        <Users size={18} />
        <h1 className="text-base font-bold">Seguimiento</h1>
      </header>
      <main className="flex-1 px-4 py-4 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-content">{children}</div>
      </main>
    </div>
  );
}
