import { createStoreMachine, type StoreMachine } from "matchina";

// Minimal, dead-simple router state: just the current path
export type RouterState = { path: string };

export type RouterTransitions = {
  push: (path: string) => (change: { from: RouterState }) => RouterState;
  replace: (path: string) => (change: { from: RouterState }) => RouterState;
  redirect: (path: string) => (change: { from: RouterState }) => RouterState;
  pop: (path: string) => (change: { from: RouterState }) => RouterState;
};

export type RouterStore = StoreMachine<RouterState, RouterTransitions>;

export function createRouterStore(): RouterStore {
  return createStoreMachine<RouterState, RouterTransitions>(
    { path: "" },
    {
      push:
        (path: string) =>
        ({ from }) =>
          from.path === path ? (undefined as any) : { path },
      replace:
        (path: string) =>
        ({ from }) =>
          from.path === path ? (undefined as any) : { path },
      redirect:
        (path: string) =>
        ({ from }) =>
          from.path === path ? (undefined as any) : { path },
      pop:
        (path: string) =>
        ({ from }) =>
          from.path === path ? (undefined as any) : { path },
    }
  );
}
