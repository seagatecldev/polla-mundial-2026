import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { SignOutButton } from "@/components/SignOutButton";
import { Avatar } from "@/components/ui/Avatar";
import { getCurrentUser, getProfile } from "@/lib/data";
import { isThEmail } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // El middleware ya protege estas rutas; esto es defensa en profundidad.
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const name = profile?.display_name ?? user.email ?? "Jugador";
  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isTH = isThEmail(user.email);

  return (
    <div className="app-shell lg:flex-row">
      {/* Barra lateral fija (solo escritorio ≥lg) */}
      <SideNav
        userId={user.id}
        name={name}
        points={profile?.total_points ?? 0}
        isAdmin={isAdmin}
        isTH={isTH}
      />

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header superior (solo móvil/tablet <lg) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90 lg:hidden">
          <Link href={`/perfil/${user.id}`} prefetch={false} className="flex items-center gap-2.5">
            <Avatar name={name} seed={user.id} size="sm" />
            <div className="leading-tight">
              <p className="text-sm font-bold">{name}</p>
              <p className="text-[11px] text-gray-400">{profile?.total_points ?? 0} pts</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {isTH && (
              <Link
                href="/th"
                prefetch={false}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-pitch dark:hover:bg-gray-800"
                aria-label="Panel de seguimiento"
                title="Seguimiento"
              >
                <Users size={20} />
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                prefetch={false}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-pitch dark:hover:bg-gray-800"
                aria-label="Panel de administración"
                title="Admin"
              >
                <Shield size={20} />
              </Link>
            )}
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-6 lg:px-8 lg:py-8">
          <div className="content-wrap">{children}</div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
