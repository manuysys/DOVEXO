import { marqueeItems } from "@/lib/marketing/content";

/*
 * Franja de marca: banda fina en azul primario con las funciones principales.
 * Solo CSS (`.mk-marquee-track`); con reduced motion se acomoda como lista.
 */
export function Marquee() {
  return (
    <section
      aria-label="Funciones principales"
      className="overflow-hidden border-y border-primary-dark/25 bg-primary py-3 text-white"
    >
      <div className="mk-marquee-mask">
        <div className="mk-marquee-track">
          <ul className="flex shrink-0 items-center">
            {marqueeItems.map((item) => (
              <li
                key={item}
                className="text-small flex shrink-0 items-center gap-6 pr-6 font-semibold tracking-[0.06em] whitespace-nowrap uppercase"
              >
                {item}
                <span aria-hidden="true" className="size-1.5 rounded-full bg-white/50" />
              </li>
            ))}
          </ul>
          <ul aria-hidden="true" className="mk-marquee-dup flex shrink-0 items-center">
            {marqueeItems.map((item) => (
              <li
                key={item}
                className="text-small flex shrink-0 items-center gap-6 pr-6 font-semibold tracking-[0.06em] whitespace-nowrap uppercase"
              >
                {item}
                <span aria-hidden="true" className="size-1.5 rounded-full bg-white/50" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
