import { isoFor } from "@/lib/flags";
import { cn } from "@/lib/utils";

/**
 * Bandera como imagen real (flagcdn.com), para que se vea igual en todos los
 * sistemas (Windows no renderiza los emojis de bandera).
 * Fallback: emoji o un globo si no hay código ISO.
 */
export function Flag({
  name,
  emoji,
  size = 24,
  className,
}: {
  name?: string | null;
  emoji?: string | null;
  size?: number;
  className?: string;
}) {
  const code = isoFor(name);
  const height = Math.round((size * 3) / 4); // proporción 4:3

  if (!code) {
    return (
      <span style={{ fontSize: size * 0.9, lineHeight: 1 }} aria-hidden>
        {emoji ?? "🏳️"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/h${height >= 60 ? 60 : height >= 40 ? 40 : 24}/${code}.png`}
      srcSet={`https://flagcdn.com/h${height >= 60 ? 120 : height >= 40 ? 80 : 48}/${code}.png 2x`}
      width={size}
      height={height}
      alt={name ?? ""}
      loading="lazy"
      className={cn("inline-block shrink-0 rounded-[3px] object-cover shadow-sm", className)}
      style={{ width: size, height }}
    />
  );
}
