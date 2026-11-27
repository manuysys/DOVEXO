const items = [
  "Solicitud recibida",
  "OT-2026-0001",
  "Turno 10:00",
  "Técnico asignado",
  "Presupuesto aprobado",
  "Cobro $95.500",
  "Misma orden",
] as const;

/**
 * Tira operativa: un guiño a la franja de producto de Anubi y al ritmo de
 * MotionSites, con datos del tenant demo. Es decorativa y se detiene con
 * reduced motion o al pasar el puntero.
 */
export function OperationalTicker() {
  return (
    <div className="mk-ticker border-y border-mk-line bg-mk-paper-2 py-2.5">
      <div aria-hidden="true" className="mk-marquee-mask overflow-hidden">
        <div className="mk-marquee-track items-center">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {items.map((item) => (
                <li
                  key={`${copy}-${item}`}
                  className="flex items-center gap-3 px-5 font-mono text-[10px] tracking-[0.08em] uppercase"
                >
                  <span className="size-1 rounded-full bg-mk-signal" />
                  <span className="text-mk-ink/75">{item}</span>
                  <span className="ml-3 h-3 w-px bg-mk-line" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <p className="sr-only">
        Ejemplo del recorrido: solicitud, turno, presupuesto aprobado y cobro de la misma orden.
      </p>
    </div>
  );
}
