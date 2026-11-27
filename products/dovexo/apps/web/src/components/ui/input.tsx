import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
