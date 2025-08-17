import React from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { DEFAULT_MAX_EXIT_MS } from "../config";
import { attachEndListener } from "../../lib/attachEndListener";
import type { ViewerProps } from "../../lib/route-viewer";
import { useAnimMode } from "./useAnimMode";
import { useCounter } from "./useCounter";

export const RTGViewer: React.FC<ViewerProps> = ({
  direction = "forward",
  classNameBase = "vt-scope",
  exitMaxMs = DEFAULT_MAX_EXIT_MS,
  viewKey,
  renderView,
}) => {
  const animMode = useAnimMode();

  const { count: exitCount, inc, dec } = useCounter(0);

  const ref = React.useMemo(() => React.createRef<HTMLDivElement>(), [viewKey]);

  return (
    <div
      className={`${classNameBase}-container`}
      data-vt-dir={direction}
      data-vt-mode-forward={animMode.forward}
      data-vt-mode-back={animMode.back}
      data-vt-mode={direction === "back" ? animMode.back : animMode.forward}
      data-vt-changing={exitCount > 0 ? 1 : undefined}
      style={{ display: "grid" }}
    >
      <TransitionGroup component={null}>
        {(() => {
          return (
            <CSSTransition
              key={viewKey}
              nodeRef={ref}
              timeout={exitMaxMs}
              appear={false}
              addEndListener={(done: () => void) => {
                const node = ref.current;
                if (node) attachEndListener(node, done);
                else done();
              }}
              onEnter={() => {
                const node = ref.current;
                if (node) {
                  node.classList.remove("is-previous-container");
                  inc(1);
                  node.classList.add("is-next-container");
                }
              }}
              onEntered={() => {
                const node = ref.current;
                if (node) {
                  node.classList.remove("is-next-container");
                  dec(1);
                }
              }}
              onExit={() => {
                inc(1);
                const node = ref.current;
                if (node) node.classList.add("is-previous-container");
              }}
              onExited={() => {
                const node = ref.current;
                if (node) node.classList.remove("is-previous-container");
                dec(1);
              }}
            >
              <div ref={ref} className={`${classNameBase}`}>
                {renderView()}
              </div>
            </CSSTransition>
          );
        })()}
      </TransitionGroup>
    </div>
  );
};
