import React, { useEffect } from "react";
import { TransitionContext } from "./rtc-shim";
import type { TransitionState as RTCState } from "./rtc-shim";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { RouterSnapshotProvider } from "./router";

// Shared types used by the adapter and viewers
export type Direction = "forward" | "back" | "replace";

// Viewers are data-driven; they own DOM. The router passes only the raw change.
export type ViewerProps = {
  change: any | null;
  direction?: Direction;
  keep?: number;
  exitMaxMs?: number; // safety max duration to keep exiting layer mounted
  classNameBase?: string;
  match?: any;
  prevMatch?: any;
  prevPath?: string;
  prevChildren?: React.ReactNode;
  prevCtx?: any;
  // Optional: per-level scoped view identity passed by Routes
  viewKey?: string;
  prevViewKey?: string;
  // Optional render function so the viewer controls rendering rather than consuming children
  renderView?: (ctx: { change: any | null; match?: any; prevMatch?: any }) => React.ReactNode;
} & { children?: React.ReactNode };

export const ImmediateViewer: React.FC<ViewerProps> = () => {
  return <></>;
};

// Debug visuals context: allows demo UI to toggle red/green frames and logs
const DebugVisContext = React.createContext<boolean>(false);
export const DebugVisProvider: React.FC<{ value: boolean; children?: React.ReactNode; }> = ({ value, children }) => (
  <DebugVisContext.Provider value={value}>{children}</DebugVisContext.Provider>
);
export const useDebugVis = () => React.useContext(DebugVisContext);

// Animation mode context (presentation-level). Defaults to slideshow for both directions.
// Extended with 'circle', 'gradient', and 'fade' (exit-only by default) modes; pointer-origin will default to center for now.
type AnimMode = 'slideshow' | 'slide' | 'circle' | 'gradient' | 'fade';
type AnimModeConfig = { forward: AnimMode; back: AnimMode };
const AnimModeContext = React.createContext<AnimModeConfig>({ forward: 'slideshow', back: 'slideshow' });
export const AnimModeProvider: React.FC<{ value: Partial<AnimModeConfig>; children?: React.ReactNode; }> = ({ value, children }) => {
  const parent = React.useContext(AnimModeContext);
  const merged = React.useMemo<AnimModeConfig>(() => ({
    forward: value.forward ?? parent.forward ?? 'slideshow',
    back: value.back ?? parent.back ?? 'slideshow',
  }), [value.forward, value.back, parent.forward, parent.back]);
  return <AnimModeContext.Provider value={merged}>{children}</AnimModeContext.Provider>;
};
export const useAnimMode = () => React.useContext(AnimModeContext);


export const SlideViewer: React.FC<ViewerProps> = ({
  change,
  children,
}) => {

  const [{ curView, newView }, setState] = React.useState({
    curView: children,
    newView: null as React.ReactNode | null,
  });
  
  useEffect(() => {
    console.log('View change', children, { curView } )
    setState(({ curView }) => ({ curView, newView: children }));
    setTimeout(() => {
      setState(({ newView }) => ({ curView: newView, newView: null }));
    }, 1000)
  }, [children]);

  return <>
    <h2>SlideViewer</h2>
    {/* <pre>{JSON.stringify(change, null, 2)}</pre> */}
    {curView}
    {newView}
  </>;
}

// A SWUP-like parallel transitions viewer.
// - Renders previous and next layers together
// - Adds scope classes and direction attribute
// - Waits for animationend/transitionend before unmounting previous
export const SlideViewerFail1: React.FC<ViewerProps> = ({
  change,
  direction = "forward",
  keep = 0,
  exitMaxMs = 60000, //5000,
  classNameBase = "vt-scope",
  match,
  prevMatch,
  prevPath,
  prevChildren,
  prevCtx,
  viewKey,
  prevViewKey,
  children,
}) => {
  // Debug flag from context or ?vtDebug=1 query param
  const debugCtx = useDebugVis();
  const debugParam = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.get('vtDebug') === '1' || sp.get('vtdebug') === '1';
  }, []);
  const debug = debugCtx || debugParam;
  const animMode = useAnimMode();
  // Direction: prefer prop from Routes; fallback to change.type when absent
  const lastDirRef = React.useRef<Direction>(direction);
  const effectiveDir: Direction = React.useMemo(() => {
    if (direction) {
      lastDirRef.current = direction;
      return direction;
    }
    const t = change?.type as string | undefined;
    if (t === 'pop') return 'back';
    if (t === 'replace') return 'replace';
    return 'forward';
  }, [direction, change?.type]);
  // Use route identity at this scope (name + params) to decide if this level changed
  const makeRouteKey = React.useCallback((m: any): string | null => {
    if (!m) return null;
    const name = (m as any).name ?? 'unknown';
    const params = (m as any).params ?? {};
    try { return `${name}:${JSON.stringify(params)}`; } catch { return String(name); }
  }, []);
  // IMPORTANT: only use props from this Routes level; do NOT fall back to global change.to/from
  const currRouteKey = React.useMemo(() => makeRouteKey(match ?? null), [makeRouteKey, match]);
  const prevRouteKey = React.useMemo(() => makeRouteKey(prevMatch ?? null), [makeRouteKey, prevMatch]);
  const currRouteName = React.useMemo(() => (match ? String((match as any).name ?? '') : ''), [match]);
  const prevRouteName = React.useMemo(() => (prevMatch ? String((prevMatch as any).name ?? '') : ''), [prevMatch]);
  const scopeChanged = React.useMemo(() => {
    // Prefer explicit per-level view keys when provided by Routes
    if (typeof viewKey !== 'undefined' || typeof prevViewKey !== 'undefined') {
      return Boolean(prevViewKey && viewKey && prevViewKey !== viewKey);
    }
    // Fallback: Only animate when BOTH this level's prev and curr matches exist AND differ
    if (prevRouteKey && currRouteKey) return prevRouteKey !== currRouteKey;
    return false;
  }, [viewKey, prevViewKey, prevRouteKey, currRouteKey]);

  // Exit lifecycle: keep previous children mounted until transition end (or timeout)
  const [exitLayer, setExitLayer] = React.useState<null | { node: React.ReactNode; key: string }>(null);
  const prevContainerRef = React.useRef<HTMLDivElement | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  // When a new transition occurs at this level, capture the previous children as an exit layer.
  // Use layout effect to avoid a paint before the container has [data-vt-changing].
  React.useLayoutEffect(() => {
    console.log('SlideViewer: useLayoutEffect', { keep, prevChildren, scopeChanged, prevRouteKey });
    if (keep > 0 && prevChildren && scopeChanged) {
      console.log('SlideViewer: useLayoutEffect: setting exit layer');
      // Use the provided prevViewKey directly - no computation needed
      setExitLayer({ node: prevChildren, key: prevViewKey || 'prev' });
    } else {
      console.log('SlideViewer: useLayoutEffect: no exit layer');
      setExitLayer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keep, prevChildren, scopeChanged]);
  // Attach transition/animation end listeners to remove exit layer
  React.useEffect(() => {
    if (!exitLayer) return;
    const el = prevContainerRef.current;
    if (!el) return;
    let done = false;
    const clear = () => {
      if (done) return;
      done = true;
      setExitLayer(null);
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    const onEnd = () => clear();
    el.addEventListener('transitionend', onEnd, { once: true } as any);
    el.addEventListener('animationend', onEnd, { once: true } as any);
    timeoutRef.current = window.setTimeout(clear, exitMaxMs);
    return () => {
      el.removeEventListener('transitionend', onEnd as any);
      el.removeEventListener('animationend', onEnd as any);
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [exitLayer, exitMaxMs]);

  // Debug: log per-level decisions when debug is enabled
  React.useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.debug('[SlideViewer]', { level: classNameBase, prevViewKey, viewKey, prevRouteKey, currRouteKey, scopeChanged, dir: effectiveDir, hasExit: !!exitLayer });
  }, [debug, prevViewKey, viewKey, prevRouteKey, currRouteKey, scopeChanged, effectiveDir, classNameBase, exitLayer]);
  const isTransitioning = exitLayer !== null;
  return (
    <div
      className={`${classNameBase}-scope`}
      data-vt-dir={effectiveDir}
      data-vt-mode-forward={animMode.forward}
      data-vt-mode-back={animMode.back}
      data-vt-mode={effectiveDir === 'back' ? animMode.back : (effectiveDir === 'forward' ? animMode.forward : 'slide')}
      // Only animate when an exit layer is actually mounted at this level
      data-vt-changing={exitLayer ? 1 : undefined}
      style={{ display: 'grid' }}
    >{isTransitioning&& "Transitioning"}
      {/* When transitioning: NEW content first (per SWUP) */}
      {exitLayer && (
        <div
          key={viewKey || 'current'}
          className={`${classNameBase}`}
          data-vt-view={currRouteName || undefined}
          style={debug ? { border: '2px solid #16a34a', background: '#dcfce7', padding: 8 } : undefined}
        >
          {children ?? null}
        </div>
      )}
      {/* Always render current content */}
      <div
        key={prevViewKey || exitLayer?.key || 'current'}
        ref={exitLayer ? prevContainerRef : undefined}
        className={`${classNameBase}`}
        data-vt-view={exitLayer ? prevRouteName : currRouteName || undefined}
        style={debug ? { border: exitLayer ? '2px solid hotpink' : '2px solid #16a34a', background: exitLayer ? '#ffe4e6' : '#dcfce7', padding: 8 } : undefined}
      >
        {exitLayer ? exitLayer.node : (children ?? null)}
      </div>
    </div>
  );
};

// React-Transition-Context-based viewer. Uses the same DOM/CSS contract as RTGViewer
// but exposes hierarchical transition state via context for nested consumers.
export const RTCViewer: React.FC<ViewerProps> = ({
  direction,
  keep,
  classNameBase = "vt-scope",
  exitMaxMs = 60000,
  viewKey,
  renderView,
  children,
}) => {
  const animMode = useAnimMode();
  const effectiveDir: Direction = React.useMemo(() => direction ?? 'forward', [direction]);
  const baseKey = React.useMemo(() => String(viewKey ?? 'root'), [viewKey]);
  // Ensure a unique instance key per mount so a new mount can coexist with an exiting sibling of the same baseKey (e.g., A -> B -> A)
  const lastBaseKeyRef = React.useRef<string | null>(null);
  const seqRef = React.useRef(0);
  if (lastBaseKeyRef.current !== baseKey) {
    seqRef.current += 1;
    lastBaseKeyRef.current = baseKey;
  }
  const transitionKey = `${baseKey}:${seqRef.current}`;

  // Track logical entering/exiting to compute RTC state
  const enteringRef = React.useRef(0);
  const exitingRef = React.useRef(0);
  const [rtcState, setRtcState] = React.useState<RTCState>('in');

  const nodeRefMap = React.useRef(new Map<string, any>());
  const getNodeRef = (key: string): any => {
    let ref = nodeRefMap.current.get(key) as any;
    if (!ref) {
      ref = React.createRef<HTMLElement>();
      nodeRefMap.current.set(key, ref);
    }
    return ref!;
  };
  const getSetRef = (key: string) => (el: HTMLDivElement | null) => {
    const r = getNodeRef(key);
    (r as any).current = el as unknown as HTMLElement | null;
  };

  const exitsRef = React.useRef(new Map<string, { node: HTMLElement; done?: () => void }>());
  const attachEndListener = (node: HTMLElement, done: () => void) => {
    const onEnd = () => {
      node.removeEventListener('transitionend', onEnd);
      node.removeEventListener('animationend', onEnd);
      done();
    };
    node.addEventListener('transitionend', onEnd);
    node.addEventListener('animationend', onEnd);
    window.setTimeout(() => done(), exitMaxMs + 50);
  };

  const buildContent = React.useCallback(() => {
    if (renderView) return (renderView as any)();
    return children ?? null;
  }, [renderView, children]);

  // Compute RTC state whenever counters change
  const recomputeRTC = React.useCallback(() => {
    if (exitingRef.current > 0) setRtcState('leaving');
    else if (enteringRef.current > 0) setRtcState('entering');
    else setRtcState('in');
  }, []);

  // Resolve current mode from animation context and direction
  const currentMode: AnimMode = effectiveDir === 'back' ? animMode.back : animMode.forward;

  return (
    <TransitionContext state={rtcState}>
      <div
        className={`${classNameBase}-scope`}
        data-vt-dir={effectiveDir}
        data-vt-mode-forward={animMode.forward}
        data-vt-mode-back={animMode.back}
        data-vt-mode={currentMode}
        data-vt-changing={exitingRef.current + enteringRef.current > 0 ? 1 : undefined}
        style={{ display: 'grid' }}
      >
        <TransitionGroup component={null}>
          {(() => {
            const myKey = transitionKey;
            const ref = getNodeRef(myKey);
            const setRef = getSetRef(myKey);
            return (
              <CSSTransition
                key={myKey}
                nodeRef={ref}
                timeout={exitMaxMs}
                appear={false}
                addEndListener={(done: () => void) => {
                  const node = ref.current;
                  const rec = exitsRef.current.get(myKey);
                  if (rec) rec.done = done;
                  if (node) attachEndListener(node, () => {
                    exitsRef.current.delete(myKey);
                    done();
                  });
                  else done();
                }}
                onEnter={() => {
                  const node = ref.current;
                  if (node) node.classList.remove('is-previous-container');
                  if (node) node.classList.add('is-next-container');
                  enteringRef.current += 1;
                  recomputeRTC();
                }}
                onEntered={() => {
                  const node = ref.current;
                  if (node) node.classList.remove('is-next-container');
                  enteringRef.current = Math.max(0, enteringRef.current - 1);
                  recomputeRTC();
                }}
                onExit={() => {
                  const node = ref.current;
                  if (node) node.classList.add('is-previous-container');
                  exitingRef.current += 1;
                  recomputeRTC();
                  if (node) exitsRef.current.set(myKey, { node });
                }}
                onExited={() => {
                  const node = ref.current;
                  if (node) node.classList.remove('is-previous-container');
                  exitingRef.current = Math.max(0, exitingRef.current - 1);
                  exitsRef.current.delete(myKey);
                  recomputeRTC();
                }}
              >
                <div ref={setRef} className={`${classNameBase}`}>
                  {buildContent()}
                </div>
              </CSSTransition>
            );
          })()}
        </TransitionGroup>
      </div>
    </TransitionContext>
  );
};

// React-Transition-Group based viewer that keeps at most 2 layers (entering + exiting).
// Integrates with existing transitions.css by:
// - Rendering a single container with data-vt-* attributes
// - Marking layers with `.vt-scope` and toggling `.is-next-container` / `.is-previous-container`
// - Using transitionend/animationend to signal exit completion
export const RTGViewer: React.FC<ViewerProps> = ({
  direction,
  keep,
  classNameBase = "vt-scope",
  // Keep a long safety timeout so CSS controls real timing; this only guards against missing end events
  exitMaxMs = 60000,
  viewKey,
  renderView,
  children,
}) => {
  const animMode = useAnimMode();
  // Derive direction if not provided
  const effectiveDir: Direction = React.useMemo(() => {
    return direction ?? 'forward';
  }, [direction]);

  // Compute stable key for RTG
  const currentKey = React.useMemo(() => {
    return String(viewKey ?? 'root');
  }, [viewKey]);

  // Track whether an exit is in progress to set data-vt-changing
  const exitingCountRef = React.useRef(0);
  const [isChanging, setIsChanging] = React.useState(false);
  // Logical, not timing-based: generation token for transition instances
  const genRef = React.useRef(0);
  // Track exiting instances by key so we can coalesce and force-complete deterministically
  const exitsRef = React.useRef(new Map<string, { node: HTMLElement; done?: () => void }>());
  const setChangingDelta = (delta: 1 | -1) => {
    exitingCountRef.current += delta;
    setIsChanging(exitingCountRef.current > 0);
  };

  // nodeRef per key to avoid findDOMNode. Widen to HTMLElement to satisfy CSSTransition's nodeRef type.
  // Loosen types to avoid RefObject invariance issues across libs
  const nodeRefMap = React.useRef(new Map<string, any>());
  const getNodeRef = (key: string): any => {
    let ref = nodeRefMap.current.get(key) as any;
    if (!ref) {
      ref = React.createRef<HTMLElement>();
      nodeRefMap.current.set(key, ref);
    }
    return ref!;
  };
  // Callback ref to bridge HTMLDivElement <- HTMLElement invariant
  const getSetRef = (key: string) => (el: HTMLDivElement | null) => {
    const r = getNodeRef(key);
    (r as any).current = el as unknown as HTMLElement | null;
  };

  // Helper: attach end listeners so CSSTransition knows when to unmount
  const attachEndListener = (node: HTMLElement, done: () => void) => {
    const onEnd = () => {
      node.removeEventListener('transitionend', onEnd);
      node.removeEventListener('animationend', onEnd);
      done();
    };
    node.addEventListener('transitionend', onEnd);
    node.addEventListener('animationend', onEnd);
    // Safety timeout
    window.setTimeout(() => done(), exitMaxMs + 50);
  };

  // Build content for the current layer
  // `renderView` may be provided by Routes; it may also be absent.
  // It is typed to accept a ctx param, but our adapter doesn't need to pass it.
  const buildContent = React.useCallback(() => {
    if (renderView) return (renderView as any)();
    return children ?? null;
  }, [renderView, children]);

  // Resolve current mode from animation context and direction.
  const currentMode: AnimMode = effectiveDir === 'back' ? animMode.back : animMode.forward;

  return (
    <div
      className={`${classNameBase}-scope`}
      data-vt-dir={effectiveDir}
      data-vt-mode-forward={animMode.forward}
      data-vt-mode-back={animMode.back}
      data-vt-mode={currentMode}
      data-vt-changing={isChanging ? 1 : undefined}
      style={{ display: 'grid' }}
    >
      <TransitionGroup component={null}>
        {(() => {
          // Capture ref bound to this key/child instance
          const myKey = currentKey;
          const ref = getNodeRef(myKey);
          const setRef = getSetRef(myKey);
          return (
            <CSSTransition
              key={myKey}
              nodeRef={ref}
              timeout={exitMaxMs}
              appear={false}
              addEndListener={(done: () => void) => {
                const node = ref.current;
                // Register done for this instance so we can force-complete logically on interrupts
                const rec = exitsRef.current.get(myKey);
                if (rec) rec.done = done;
                if (node) attachEndListener(node, () => {
                  // Cleanup registry on natural end
                  exitsRef.current.delete(myKey);
                  done();
                });
                else done();
              }}
              onEnter={() => {
                // If an exit was interrupted and this key returned, clean any exit class
                const node = ref.current;
                if (node) node.classList.remove('is-previous-container');
                // Always mark next container; CSS decides whether it actually animates for mode
                setChangingDelta(1);
                if (node) node.classList.add('is-next-container');
              }}
              onEntered={() => {
                const node = ref.current;
                if (node) node.classList.remove('is-next-container');
                setChangingDelta(-1);
              }}
              onExit={() => {
                setChangingDelta(1);
                const node = ref.current;
                if (node) node.classList.add('is-previous-container');
                // Register this exiting instance by key for deterministic coalescing
                if (node) exitsRef.current.set(myKey, { node });
              }}
              onExited={() => {
                const node = ref.current;
                if (node) node.classList.remove('is-previous-container');
                setChangingDelta(-1);
                exitsRef.current.delete(myKey);
              }}
            >
              <div ref={setRef} className={`${classNameBase}`}>
                {buildContent()}
              </div>
            </CSSTransition>
          );
        })()}
      </TransitionGroup>
    </div>
  );
};
