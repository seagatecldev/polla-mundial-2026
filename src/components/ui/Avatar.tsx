import { cn } from "@/lib/utils";
import { avatarColor, initials } from "@/lib/utils";

export function Avatar({
  name,
  seed,
  size = "md",
}: {
  name: string;
  seed?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
  }[size];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        dims
      )}
      style={{ backgroundColor: avatarColor(seed || name) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
