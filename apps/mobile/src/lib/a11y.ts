import { AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

/**
 * Respeta la preferencia de movimiento reducido del sistema.
 * Las animaciones decorativas (skeletons, sheets) se desactivan con esto.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      setReduced(value);
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}