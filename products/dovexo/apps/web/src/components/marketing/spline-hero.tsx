"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/*
 * Escena 3D de Spline publicada (DOVEXO Hero Service).
 * Solo se carga en desktop, sin reduced motion y después del primer render:
 * el runtime pesa ~1 MB y no debe competir con el LCP del titular.
 */
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => null,
});

const QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

type SplineHeroProps = {
  onReady?: () => void;
};

export function SplineHero({ onReady }: SplineHeroProps) {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!enabled) return null;

  return (
    <Spline
      scene="https://prod.spline.design/4zymsRJr14mnwaEJ/scene.splinecode"
      onLoad={onReady}
      /*
       * Render a 2x y escalar a la mitad: el runtime dibuja el canvas al tamaño
       * del contenedor, así que un contenedor al 200% con `scale(0.5)` duplica
       * la resolución efectiva y suaviza los bordes del render 3D.
       */
      style={{
        width: "200%",
        height: "200%",
        transform: "scale(0.5)",
        transformOrigin: "top left",
      }}
    />
  );
}
