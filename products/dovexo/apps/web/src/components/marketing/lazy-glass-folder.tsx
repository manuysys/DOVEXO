"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { FolderFile, GlassFolderProps } from "@/components/ui/glass-folder-cards";

const GlassFolder = dynamic(
  () => import("@/components/ui/glass-folder-cards").then((module) => module.default),
  { ssr: false },
);

type LazyGlassFolderProps = GlassFolderProps & {
  /** Dispara el `+` una vez cuando la carpeta entra en viewport. */
  autoAdd?: boolean;
  /** Archivo que agrega el `+` automático. Debe ser serializable. */
  autoAddFile?: FolderFile;
};

/**
 * La carpeta pinta arte en canvas. La montamos recién cuando el navegador se
 * acerca a la sección para no gastar main thread antes del LCP.
 */
export function LazyGlassFolder({
  autoAdd,
  autoAddFile,
  onAdd,
  ...props
}: LazyGlassFolderProps) {
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
      { rootMargin: "480px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !autoAdd) return;
    const timer = window.setTimeout(() => {
      ref.current
        ?.querySelector<HTMLButtonElement>('button[aria-label^="Add a file"]')
        ?.click();
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [autoAdd, visible]);

  return (
    <div ref={ref} className="flex min-h-[307px] w-full max-w-[320px] items-center justify-center">
      {visible ? (
        <GlassFolder
          {...props}
          onAdd={onAdd ?? (autoAddFile ? () => autoAddFile : undefined)}
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-[307px] w-full max-w-full animate-pulse rounded-[22px] border border-mk-line bg-mk-paper motion-reduce:animate-none"
        />
      )}
    </div>
  );
}
