import { cn } from "@/lib/utils";

/*
 * Ilustración isométrica 2D del circuito de servicio: oficina → técnico/van →
 * cliente, con nodos de ruta. SVG puro, sin dependencias, decorativa
 * (aria-hidden). Paleta del design system DOVEXO.
 */
export function ServiceMap({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 460"
      className={cn("h-full w-full", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grilla isométrica sutil */}
      <g stroke="#FFFFFF" strokeOpacity="0.05" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, index) => (
          <line
            key={`gx-${index}`}
            x1={40 + index * 70}
            y1={60}
            x2={-40 + index * 70}
            y2={460}
          />
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <line
            key={`gy-${index}`}
            x1={0}
            y1={120 + index * 60}
            x2={640}
            y2={60 + index * 60}
          />
        ))}
      </g>

      {/* Ruta punteada oficina → técnico → cliente */}
      <path
        d="M 200 268 C 250 240 285 262 322 300 S 420 250 486 232"
        stroke="#4CB7D8"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeDasharray="7 9"
        className="mk-route-dash"
      />

      {/* Nodos de la ruta */}
      <g>
        <circle cx="200" cy="268" r="5" fill="#11A69A" />
        <circle cx="200" cy="268" r="10" stroke="#11A69A" strokeOpacity="0.35" strokeWidth="2" className="mk-node-ring" />
        <circle cx="486" cy="232" r="5" fill="#11A69A" />
        <circle cx="486" cy="232" r="10" stroke="#11A69A" strokeOpacity="0.35" strokeWidth="2" className="mk-node-ring" />
      </g>

      {/* Oficina (isométrico) */}
      <g>
        <polygon points="80,300 200,300 200,190 80,190" fill="#1B2B47" stroke="#315EFB" strokeOpacity="0.35" />
        <polygon points="200,300 260,270 260,160 200,190" fill="#16233A" stroke="#315EFB" strokeOpacity="0.25" />
        <polygon points="80,190 200,190 260,160 140,160" fill="#22345A" stroke="#315EFB" strokeOpacity="0.35" />
        <rect x="98" y="212" width="22" height="16" rx="2" fill="#4CB7D8" fillOpacity="0.55" />
        <rect x="132" y="212" width="22" height="16" rx="2" fill="#4CB7D8" fillOpacity="0.35" />
        <rect x="166" y="212" width="22" height="16" rx="2" fill="#4CB7D8" fillOpacity="0.55" />
        <rect x="98" y="244" width="22" height="16" rx="2" fill="#4CB7D8" fillOpacity="0.35" />
        <rect x="132" y="244" width="22" height="16" rx="2" fill="#4CB7D8" fillOpacity="0.55" />
        <rect x="166" y="244" width="22" height="16" rx="2" fill="#4CB7D8" fillOpacity="0.35" />
        <rect x="120" y="276" width="30" height="24" rx="3" fill="#0F172A" stroke="#315EFB" strokeOpacity="0.4" />
      </g>

      {/* Van de servicio */}
      <g>
        <polygon points="268,330 366,330 366,292 268,292" fill="#0F172A" stroke="#11A69A" strokeOpacity="0.5" />
        <polygon points="366,330 398,314 398,276 366,292" fill="#0B1220" stroke="#11A69A" strokeOpacity="0.4" />
        <polygon points="268,292 366,292 398,276 300,276" fill="#16324F" stroke="#11A69A" strokeOpacity="0.45" />
        <rect x="278" y="300" width="34" height="20" rx="3" fill="#4CB7D8" fillOpacity="0.4" />
        <rect x="320" y="300" width="34" height="20" rx="3" fill="#4CB7D8" fillOpacity="0.25" />
        <circle cx="292" cy="332" r="9" fill="#0B1220" stroke="#94A3B8" strokeOpacity="0.6" />
        <circle cx="352" cy="332" r="9" fill="#0B1220" stroke="#94A3B8" strokeOpacity="0.6" />
        <line x1="300" y1="276" x2="300" y2="264" stroke="#11A69A" strokeOpacity="0.6" strokeWidth="2" />
        <line x1="330" y1="276" x2="330" y2="264" stroke="#11A69A" strokeOpacity="0.6" strokeWidth="2" />
        <line x1="360" y1="276" x2="360" y2="264" stroke="#11A69A" strokeOpacity="0.6" strokeWidth="2" />
      </g>

      {/* Técnico junto a la van */}
      <g>
        <circle cx="420" cy="316" r="8" fill="#F0C39B" />
        <path d="M 412 312 a 8 8 0 0 1 16 0 z" fill="#D69B28" />
        <rect x="412" y="324" width="16" height="26" rx="6" fill="#11A69A" />
        <rect x="414" y="350" width="5" height="14" rx="2.5" fill="#0F172A" />
        <rect x="421" y="350" width="5" height="14" rx="2.5" fill="#0F172A" />
        <line x1="428" y1="330" x2="440" y2="322" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <circle cx="441" cy="321" r="3.5" fill="#CBD5E1" />
      </g>

      {/* Casa del cliente (isométrico) */}
      <g>
        <polygon points="470,300 560,300 560,236 470,236" fill="#1B2B47" stroke="#315EFB" strokeOpacity="0.35" />
        <polygon points="560,300 596,280 596,216 560,236" fill="#16233A" stroke="#315EFB" strokeOpacity="0.25" />
        <polygon points="470,236 560,236 596,216 506,216" fill="#22345A" stroke="#315EFB" strokeOpacity="0.35" />
        <polygon points="458,236 572,236 515,186" fill="#11A69A" fillOpacity="0.85" />
        <rect x="506" y="262" width="26" height="38" rx="3" fill="#0F172A" stroke="#315EFB" strokeOpacity="0.4" />
        <rect x="480" y="252" width="18" height="14" rx="2" fill="#D69B28" fillOpacity="0.65" />
        <rect x="534" y="252" width="18" height="14" rx="2" fill="#D69B28" fillOpacity="0.4" />
      </g>

      {/* Destello de confirmación */}
      <g transform="translate(516 196)">
        <circle r="14" fill="#16865A" />
        <path d="M -6 0 L -1 5 L 7 -5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
