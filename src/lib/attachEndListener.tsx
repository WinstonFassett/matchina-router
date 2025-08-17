import { DEFAULT_MAX_EXIT_MS } from "../demo/config";

// Helper: attach end listeners so CSSTransition knows when to unmount
export function attachEndListener(
  node: HTMLElement,
  done: () => void,
  exitMaxMs = DEFAULT_MAX_EXIT_MS
) {
  const onEnd = () => {
    node.removeEventListener("transitionend", onEnd);
    node.removeEventListener("animationend", onEnd);
    done();
  };
  node.addEventListener("transitionend", onEnd);
  node.addEventListener("animationend", onEnd);
  // Safety timeout
  window.setTimeout(onEnd, exitMaxMs + 50);
}
