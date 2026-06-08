"use client";

import { useState } from "react";
import { config } from "@/lib/config";

/** Imagen que se oculta sola si el archivo aún no existe (evita el ícono roto). */
function SafeLogo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />;
}

/**
 * Logos de marca (configurables por env vía src/lib/config.ts).
 * Por defecto: escudo de Ecuador + logo de Seagate, lado a lado.
 * Si no hay logo secundario, se muestra solo el principal (sin separador).
 */
export function BrandLogos({ size = "md" }: { size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-9" : "h-16 sm:h-20";
  const { logoPrimary, logoPrimaryAlt, logoSecondary, logoSecondaryAlt } = config.brand;
  // Sin logos configurados (p. ej. demo genérica): no renderiza nada.
  if (!logoPrimary && !logoSecondary) return null;
  return (
    <div className="flex items-center justify-center gap-4 animate-fade-in">
      {logoPrimary && (
        <SafeLogo
          src={logoPrimary}
          alt={logoPrimaryAlt}
          className={`${h} w-auto rounded-xl object-contain shadow-sm`}
        />
      )}
      {logoPrimary && logoSecondary && (
        <>
          <span className="h-10 w-px bg-gray-300/60 dark:bg-gray-600/60" aria-hidden />
          <SafeLogo
            src={logoSecondary}
            alt={logoSecondaryAlt}
            className={`${h} w-auto object-contain drop-shadow-sm`}
          />
        </>
      )}
    </div>
  );
}
