"use client";

import { Check } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent as ReactPointerEvent } from "react";

import {
  demoRefs,
  getCustomer,
  getOrder,
  getQuote,
} from "@/lib/marketing/demo-data";
import { formatArs } from "@/lib/marketing/pricing";

import { ApprovalStamp } from "./approval-stamp";
import { PanelShell } from "./panels";

const quote = getQuote(demoRefs.approvedQuoteId);
const order = getOrder(quote.orderId);
const customer = getCustomer(order.customerId);

/**
 * El objeto del hero: un presupuesto real ya aprobado. El sello entra una vez
 * y el panel sigue al puntero con un tilt máximo de 4°, sin halo ni capas
 * decorativas.
 */
export function QuoteDemo() {
  /**
   * El hero muestra el estado aprobado desde el primer paint. El sello tiene
   * una entrada CSS y no hay un cambio de estado posterior que repinte el panel
   * y retrase el LCP.
   */
  const reduce = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [4, -4]), {
    stiffness: 140,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 140,
    damping: 20,
  });

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div className="relative">
      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        className="relative"
      >
      <PanelShell className="relative">
        <div className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mk-mono text-[13px] tracking-[0.06em] text-mk-panel-muted">
                {quote.id}
              </p>
              <p className="mt-2 text-[16px] text-mk-panel-muted">
                {customer.name} · {customer.zone}
              </p>
            </div>
            <div className="flex w-[120px] shrink-0 justify-end">
              <ApprovalStamp
                label="Aprobado"
                detail={quote.id}
                size="sm"
                className="mk-stamp-in shrink-0"
              />
            </div>
          </div>

          <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
            {quote.items.slice(0, 2).map((item) => (
              <div key={item.description} className="flex items-center justify-between gap-4">
                <span className="text-[15px] text-mk-panel-muted">{item.description}</span>
                <span className="mk-mono text-[13px] text-mk-panel-text">
                  {formatArs(item.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-[13px] text-mk-panel-muted">Total</p>
              <p className="mk-display mt-1 text-3xl font-semibold tracking-[-0.04em]">
                {formatArs(quote.total)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-mk-paper px-5 py-3 text-sm font-semibold text-mk-ink disabled:cursor-default disabled:opacity-90"
            >
              <Check className="size-4" aria-hidden="true" />
              Presupuesto aprobado
            </button>
            <p className="mk-mono text-[13px] tracking-[0.04em] text-mk-panel-muted">
              {order.id}
            </p>
          </div>
        </div>
      </PanelShell>
      </motion.div>
    </div>
  );
}
