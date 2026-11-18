"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  AGENDA_VIEWS,
  agendaRangeLabel,
  formatDayLong,
  type AgendaView,
} from "@/components/agenda/agenda-utils";
import { Button } from "@/components/ui/button";
import { todayArgentinaDay } from "@/lib/agenda";
import { cn } from "@/lib/utils";

type AgendaToolbarProps = {
  view: AgendaView;
  day: string;
  days: readonly string[];
  onViewChange: (view: AgendaView) => void;
  onDayChange: (day: string) => void;
  onShift: (delta: number) => void;
};

export function AgendaToolbar({
  view,
  day,
  days,
  onViewChange,
  onDayChange,
  onShift,
}: AgendaToolbarProps) {
  const isToday = day === todayArgentinaDay();
  const isWeek = view === "week";
  const label = agendaRangeLabel(view, day, days);
  const step = isWeek ? 7 : 1;
  const previousLabel = isWeek ? "Semana anterior" : "Día anterior";
  const nextLabel = isWeek ? "Semana siguiente" : "Día siguiente";

  return (
    <section
      aria-label="Navegación de la agenda"
      className="border-border bg-surface flex flex-col gap-3 rounded-ds-lg border p-3 shadow-card lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onShift(-step)}
            aria-label={previousLabel}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onShift(step)}
            aria-label={nextLabel}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="min-w-0">
          <p className="text-text-2 text-label">{isWeek ? "Semana" : "Día"}</p>
          <p className="text-h4 text-text truncate" aria-live="polite">
            {label}
          </p>
          {isWeek && (
            <p className="text-text-2 text-caption">
              Día seleccionado: {formatDayLong(day)}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDayChange(todayArgentinaDay())}
          disabled={isToday}
        >
          Hoy
        </Button>

        <div className="flex items-center gap-2">
          <label htmlFor="agenda-date" className="sr-only">
            Elegir fecha de la agenda
          </label>
          <input
            id="agenda-date"
            type="date"
            value={day}
            onChange={(event) => {
              if (event.target.value) onDayChange(event.target.value);
            }}
            className="border-border bg-surface text-text focus-visible:border-primary focus-visible:ring-primary/20 min-h-10 rounded-ds-md border px-3 text-small focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Vista de la agenda"
        className="bg-surface-2 flex w-full rounded-ds-md p-1 sm:w-auto"
      >
        {AGENDA_VIEWS.map((option) => {
          const active = view === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onViewChange(option.value)}
              className={cn(
                "focus-visible:ring-primary min-h-9 flex-1 rounded-ds-sm px-3 text-small font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:flex-none",
                active
                  ? "bg-surface text-text shadow-card"
                  : "text-text-2 hover:text-text hover:bg-surface/60",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
