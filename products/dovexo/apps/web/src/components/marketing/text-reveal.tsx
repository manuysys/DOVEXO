"use client";

import { useEffect, useRef, useState } from "react";
import type { ElementType } from "react";

import { cn } from "@/lib/utils";

type TextRevealProps = {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
  delay?: number;
};

/**
 * Titular por palabras con IntersectionObserver propio. El observer corre al
 * montar y también cuando la sección ya está en viewport, así un ancla o un
 * scroll rápido no dejan el título escondido.
 */
export function TextReveal({
  text,
  as: Tag = "h2",
  className,
  id,
  delay = 0,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [reduce, setReduce] = useState(false);
  const words = text.split(" ");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      const frame = requestAnimationFrame(() => {
        setReduce(true);
        setShown(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setShown(true);
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <Tag id={id} aria-label={text} className={cn("text-balance", className)}>
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            aria-hidden="true"
            className="inline-block overflow-hidden align-bottom"
          >
            <span
              className="inline-block"
              style={{
                transform: shown || reduce ? "none" : "translateY(115%)",
                transition: reduce
                  ? "none"
                  : "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: reduce ? "0ms" : `${delay + index * 40}ms`,
              }}
            >
              {word}
              {index < words.length - 1 ? "\u00a0" : ""}
            </span>
          </span>
        ))}
      </Tag>
    </div>
  );
}
