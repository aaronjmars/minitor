"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Holds a `true` value visible for at least `ms` milliseconds, even if the
 * source flips to `false` sooner. Lets fast fetches still register the
 * fetching/beam animation.
 */
export function useMinDuration(value: boolean, ms: number): boolean {
  const [held, setHeld] = useState(value);
  // React's blessed pattern for deriving state from props: compare to the
  // previous value during render. When `value` flips true, immediately set
  // `held = true`; the false transition is deferred to the timer below.
  const [prev, setPrev] = useState(value);
  const startedAtRef = useRef<number | null>(null);

  if (prev !== value) {
    setPrev(value);
    if (value && !held) setHeld(true);
  }

  useEffect(() => {
    if (value) {
      startedAtRef.current = Date.now();
      return;
    }
    if (startedAtRef.current === null) return;
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, ms - elapsed);
    const id = setTimeout(() => {
      startedAtRef.current = null;
      setHeld(false);
    }, remaining);
    return () => clearTimeout(id);
  }, [value, ms]);

  return held;
}
