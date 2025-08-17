import React from "react";

export function useCounter(initial = 0) {
  const [count, set] = React.useState(initial);
  const inc = React.useCallback((n = 1) => set((c) => c + n), []);
  const dec = React.useCallback((n = 1) => set((c) => Math.max(0, c - n)), []);
  const reset = React.useCallback(() => set(initial), [initial]);
  return { count, inc, dec, reset } as const;
}
