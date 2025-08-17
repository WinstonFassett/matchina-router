import * as React from "react";

// Minimal local shim to avoid external peer-dep issues.
// Provides a TransitionContext with a simple `state` string and `overallState` alias.
// This matches only what our RTCViewer currently consumes.

export type TransitionState = 'appearing' | 'entering' | 'in' | 'leaving' | 'out';

type Ctx = { state: TransitionState; overallState: TransitionState };
const Ctx = React.createContext<Ctx | null>(null);

export const TransitionContext: React.FC<{ state: TransitionState; children?: React.ReactNode }> = ({ state, children }) => {
  const value = React.useMemo<Ctx>(() => ({ state, overallState: state }), [state]);
  return React.createElement(Ctx.Provider, { value }, children as any);
};

export function useTransitionState(): TransitionState {
  const ctx = React.useContext(Ctx);
  return ctx?.overallState ?? 'in';
}
