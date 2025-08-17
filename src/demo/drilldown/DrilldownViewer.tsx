import * as React from "react";
import ViewSlider, {
  type SimpleViewSliderProps,
} from "react-view-slider/simple";

export interface OurDrilldownProps extends SimpleViewSliderProps {
  useRouterHook: () => { to: any };
  renderView?: (ctx: {
    change: any | null;
    match?: any;
    prevMatch?: any;
  }) => React.ReactNode;
  viewKey?: string;
  getDepth?: (key?: string | null) => number;
}

export type DDRouteProps = {
  name: string;
  component: React.ComponentType<any>;
  when?: (ctx: { name: string; params: any }) => boolean;
};

export const DDRoute: React.FC<DDRouteProps> = () => null;

export const DrilldownViewer: React.FC<OurDrilldownProps> = (props) => {
  const {
    children,
    animateHeight,
    keepViewsMounted,
    keepPrecedingViewsMounted,
    transitionDuration,
    transitionTimingFunction,
    prefixer,
    fillParent,
    className,
    style,
    viewportClassName,
    viewportStyle,
    viewStyle,
    innerViewWrapperStyle,
    useRouterHook,
    renderView: viewerRender,
    viewKey,
    getDepth,
  } = props;

  let childNode: React.ReactNode = null;
  let childKey: string = "0";

  if (typeof viewerRender === "function") {
    const node = viewerRender({ change: null });
    const depthKey =
      typeof getDepth === "function" ? getDepth(viewKey) : undefined;
    childKey =
      depthKey != null
        ? String(depthKey)
        : viewKey != null
          ? String(viewKey)
          : "0";
    childNode = node as any;
  } else {
    const useRouter = useRouterHook; //|| _useRouterFallback;
    const { to } = useRouter!();
    const routeName = to?.name as string | undefined;
    const params = (to as any)?.params || {};

    // Gather all DDRoute elements preserving their React keys and order
    const routes: Array<{
      el: React.ReactElement<DDRouteProps>;
      index: number;
    }> = [];
    React.Children.forEach(children, (el) => {
      if (!React.isValidElement(el)) return;
      if (el.type === DDRoute)
        routes.push({
          el: el as React.ReactElement<DDRouteProps>,
          index: routes.length,
        });
    });

    // Pick the first matching route by name and optional predicate
    let selected: {
      el: React.ReactElement<DDRouteProps>;
      index: number;
    } | null = null;
    for (const entry of routes) {
      const p = entry.el.props as DDRouteProps;
      if (
        p.name === routeName &&
        (!p.when || p.when({ name: routeName!, params }))
      ) {
        selected = entry;
        break;
      }
    }
    if (!selected) return null;

    const Comp = (selected.el.props as DDRouteProps)
      .component as React.ComponentType<any>;
    childNode = <Comp {...params} />;
    childKey =
      selected.el.key != null
        ? String(selected.el.key)
        : String(selected.index);
  }

  return (
    <ViewSlider
      animateHeight={!!animateHeight}
      keepViewsMounted={!!keepViewsMounted}
      keepPrecedingViewsMounted={!!keepPrecedingViewsMounted}
      transitionDuration={transitionDuration ?? undefined}
      transitionTimingFunction={transitionTimingFunction ?? undefined}
      prefixer={prefixer}
      fillParent={!!fillParent}
      className={className || undefined}
      style={style || undefined}
      viewportClassName={viewportClassName || undefined}
      viewportStyle={viewportStyle || undefined}
      viewStyle={viewStyle || undefined}
      innerViewWrapperStyle={innerViewWrapperStyle || undefined}
    >
      <React.Fragment key={childKey}>{childNode}</React.Fragment>
    </ViewSlider>
  );
};

export default DrilldownViewer;
