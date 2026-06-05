"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavActive } from "@/lib/nav";
import { Avatar } from "@/components/ui/Avatar";
import { SignOutButton } from "@/components/SignOutButton";
import { BrandLogos } from "@/components/BrandLogos";

type Props = {
  userId: string;
  name: string;
  points: number;
  isAdmin: boolean;
};

/**
 * Barra lateral de navegación para escritorio (≥lg). En móvil se oculta y se
 * usa la BottomNav + el header superior.
 */
export function SideNav({ userId, name, points, isAdmin }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:dark:border-gray-800 lg:dark:bg-gray-950">
      {/* Marca */}
      <div className="flex flex-col gap-2 px-5 py-5">
        <BrandLogos size="sm" />
        <span className="text-sm font-extrabold leading-tight text-pitch dark:text-pitch-light">
          Mundial 2026
        </span>
      </div>

      {/* Perfil */}
      <Link
        href={`/perfil/${userId}`}
        className="mx-3 flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Avatar name={name} seed={userId} size="sm" />
        <div className="leading-tight">
          <p className="text-sm font-bold">{name}</p>
          <p className="text-[11px] text-gray-400">{points} pts</p>
        </div>
      </Link>

      {/* Navegación */}
      <nav className="mt-2 flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(href, pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-pitch/10 text-pitch dark:text-pitch-light"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Pie: admin + cerrar sesión */}
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        {isAdmin ? (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-pitch dark:text-gray-400 dark:hover:bg-gray-800"
            title="Admin"
          >
            <Shield size={18} />
            Admin
          </Link>
        ) : (
          <span />
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
