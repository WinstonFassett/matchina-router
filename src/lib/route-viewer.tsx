import React from "react";
import type { Direction } from "./create-router";

export type ViewerProps = {
  change: any | null;
  direction: Direction;
  keep?: number;
  exitMaxMs?: number;
  classNameBase?: string;
  match?: any;
  prevMatch?: any;
  prevPath?: string;
  prevChildren?: React.ReactNode;
  viewKey: string;
  prevViewKey?: string;
  renderView: () => React.ReactNode;
};

export type ViewerComponent = React.FC<ViewerProps>;

const Ctx = React.createContext<ViewerComponent | null>(null);

export const ViewerProvider: React.FC<
  React.PropsWithChildren<{ value: ViewerComponent }>
> = ({ value, children }) => {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useViewer(): ViewerComponent {
  return React.useContext(Ctx) || PassthroughViewer;
}

export const PassthroughViewer: ViewerComponent = ({ children }: any) => (
  <>{children}</>
);
