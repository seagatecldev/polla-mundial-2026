"use client";

import { useState } from "react";

/** Imagen que se oculta sola si el archivo aún no existe (evita el ícono roto). */
function SafeLogo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />;
}

/**
 * Escudo de Ecuador (FEF) + logo de Seagate, lado a lado.
 * Los archivos viven en /public: escudo-ecuador.png y seagate.png.
 */
export function BrandLogos({ size = "md" }: { size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-9" : "h-16 sm:h-20";
  return (
    <div className="flex items-center justify-center gap-4 animate-fade-in">
      <SafeLogo
        src="/escudo-ecuador.png"
        alt="Selección de Ecuador"
        className={`${h} w-auto object-contain drop-shadow-sm`}
      />
      <span className="h-10 w-px bg-gray-300/60 dark:bg-gray-600/60" aria-hidden />
      <SafeLogo
        src="/seagate.png"
        alt="Seagate"
        className={`${h} w-auto object-contain drop-shadow-sm`}
      />
    </div>
  );
}
