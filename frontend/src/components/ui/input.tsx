import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3.5 py-2.5 text-sm text-[var(--text)] shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-[color:var(--muted)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-[var(--soft)] disabled:text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}
