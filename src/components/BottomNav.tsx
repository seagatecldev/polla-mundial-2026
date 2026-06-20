"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavActive } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 mx-auto w-full max-w-app border-t border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90 lg:hidden">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                prefetch={false}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
                  active ? "text-pitch dark:text-pitch-light" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
