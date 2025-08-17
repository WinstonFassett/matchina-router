import React from "react";

// Debug visuals context: allows demo UI to toggle red/green frames and logs
const DebugVisContext = React.createContext<boolean>(false);
export const DebugVisProvider: React.FC<{
  value: boolean;
  children?: React.ReactNode;
}> = ({ value, children }) => (
  <DebugVisContext.Provider value={value}>{children}</DebugVisContext.Provider>
);
export const useDebugVis = () => React.useContext(DebugVisContext);
