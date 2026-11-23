"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const OperationalScene = dynamic(
  () => import("./operational-scene").then((module) => module.OperationalScene),
  { ssr: false },
);

export function LazyOperationalScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setVisible(true);
      },
      { rootMargin: "420px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <OperationalScene className="absolute inset-0" />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(228,87,46,0.1),transparent_45%),linear-gradient(rgba(141,151,170,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(141,151,170,0.08)_1px,transparent_1px)] bg-[size:auto,56px_56px,56px_56px]"
        />
      )}
    </div>
  );
}
