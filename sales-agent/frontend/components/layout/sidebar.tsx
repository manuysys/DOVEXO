"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveNavItem, NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        role="presentation"
        onClick={onNavigate}
        className={cn(
          "fixed inset-0 z-30 bg-ink/40 backdrop-blur-[1px] lg:hidden",
          open ? "block" : "hidden",
        )}
      />
      <aside
        aria-label="Navegación principal"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-slate-300 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 flex-col justify-center border-b border-white/10 px-5">
          <span className="text-sm font-semibold tracking-[0.22em] text-white">
            ARVOKTA
          </span>
          <span className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">
            Sales Agent
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = isActiveNavItem(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="truncate">{item.label}</span>
                {item.phase ? (
                  <span className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                    F{item.phase}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-slate-400">
          Uso interno · Fase 2A
          <br />
          Sin registro público
        </div>
      </aside>
    </>
  );
}
