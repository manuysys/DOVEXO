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
      className="h-full w-full"
    />
  );
}
