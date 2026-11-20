import Image from "next/image";

const stations = [
  {
    id: "solicitud",
    number: "01",
    title: "Solicitud",
    text: "Se carga en la oficina o la recibe el portal del cliente.",
    image: "/product-tour/orders.webp",
    alt: "Órdenes de trabajo en DOVEXO",
    stamp: "Recibida",
  },
  {
    id: "turno",
    number: "02",
    title: "Turno",
    text: "Se asigna el técnico y se controla el solapamiento.",
    image: "/product-tour/agenda.webp",
    alt: "Agenda del día con los turnos asignados",
    stamp: "Agendada",
  },
  {
    id: "presupuesto",
    number: "03",
    title: "Presupuesto",
    text: "El cliente lo aprueba desde un link, sin crear cuenta.",
    image: "/product-tour/quotes.webp",
    alt: "Presupuestos con estados e importes",
    stamp: "Aprobada",
  },
  {
    id: "cobro",
    number: "04",
    title: "Cobro",
    text: "Total o parcial. El saldo queda a la vista.",
    image: "/product-tour/portal.webp",
    alt: "Portal del cliente con pagos y saldo",
    stamp: "Cobrada",
  },
] as const;

/*
 * La orden como hilo: la misma OT recorre solicitud, turno, presupuesto y
 * cobro. Reemplaza el recorrido animado y las cuatro filas alternadas.
 */
export function OrderRail() {
  return (
    <section id="recorrido" aria-labelledby="rail-title" className="bg-mk-paper py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-2 lg:grid-cols-[220px_1fr] lg:gap-8">
          <div className="flex items-center gap-3">
            <b className="mk-label text-mk-signal-strong">01</b>
            <span aria-hidden="true" className="h-px w-8 bg-mk-signal" />
            <span className="mk-label text-mk-slate">Una sola orden</span>
          </div>
          <div>
            <h2
              id="rail-title"
              className="max-w-[22ch] text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.06] font-bold tracking-[-0.03em] text-balance text-mk-ink"
            >
              Del primer llamado al último cobro, la misma orden.
            </h2>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.6] text-mk-ink/75">
              La orden es el hilo: nace en una solicitud, se agenda, se presupuesta y se cobra. Cada
              paso queda registrado con su actor y su fecha.
            </p>
          </div>
        </div>

        <div className="relative mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span
            aria-hidden="true"
            className="absolute top-[18px] right-[6%] left-[6%] hidden h-px bg-mk-line lg:block"
          />
          {stations.map((station) => (
            <article key={station.id} className="relative min-w-0">
              <div className="relative z-10 mb-4 grid size-9 place-items-center rounded-full border border-mk-line bg-mk-paper text-[12px] font-bold text-mk-ink">
                {station.number}
              </div>
              <div className="overflow-hidden rounded-md border border-mk-ink/20 bg-white">
                <Image
                  src={station.image}
                  alt={station.alt}
                  width={1440}
                  height={900}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
                  className="h-[132px] w-full object-cover object-top"
                />
              </div>
              <h3 className="mt-3.5 text-lg font-bold tracking-[-0.01em] text-mk-ink">
                {station.title}
              </h3>
              <p className="mt-1 min-h-10 text-sm leading-[1.5] text-mk-ink/75">{station.text}</p>
              <p className="mt-3 font-mono text-[11px] tracking-[0.02em] text-mk-slate">
                OT-2026-0001
              </p>
              <span className="mt-2 inline-block -rotate-2 rounded-[2px] border-[1.5px] border-mk-signal-strong bg-mk-signal/5 px-1.5 py-1 text-[9px] font-bold tracking-[0.16em] uppercase text-mk-signal-strong">
                {station.stamp}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
