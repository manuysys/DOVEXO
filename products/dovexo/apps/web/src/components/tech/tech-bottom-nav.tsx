"use client";

import { CalendarDays, ClipboardList, Home, UserRound } from "lucide-react";
import Link from "next/link";
import { useState, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

type Props = {
  onProfile: () => void;
  profileOpen: boolean;
};

const sections = [
  { id: "tech-home", href: "/tech", label: "Inicio", icon: Home },
  { id: "agenda", href: "/tech#agenda", label: "Agenda", icon: CalendarDays },
  { id: "trabajos", href: "/tech#trabajos", label: "Trabajos", icon: ClipboardList },
] as const;

function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function TechBottomNav({ onProfile, profileOpen }: Props) {
  const [active, setActive] = useState<string>("tech-home");

  function handleClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    setActive(id);
    if (id === "tech-home") {
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }

  return (
    <nav
      aria-label="Navegación del técnico"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto grid max-w-xl grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {sections.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(event) => handleClick(event, item.id)}
              aria-current={isActive ? (item.id === "tech-home" ? "page" : "location") : undefined}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset",
                isActive ? "text-primary" : "text-text-2 hover:text-text",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-full",
                  isActive ? "bg-primary" : "bg-transparent",
                )}
              />
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onProfile}
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold text-text-2 transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset",
            profileOpen && "text-primary",
          )}
        >
          <UserRound className="h-5 w-5" aria-hidden="true" />
          Perfil
        </button>
      </div>
    </nav>
  );
}
