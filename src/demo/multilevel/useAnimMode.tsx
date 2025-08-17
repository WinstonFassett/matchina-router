import React from "react";

export type AnimMode = "slideshow" | "slide" | "circle" | "gradient" | "fade";
export type AnimModeConfig = { forward: AnimMode; back: AnimMode };

const AnimModeContext = React.createContext<AnimModeConfig>({
  forward: "slideshow",
  back: "slideshow",
});
export const AnimModeProvider: React.FC<{
  value: Partial<AnimModeConfig>;
  children?: React.ReactNode;
}> = ({ value, children }) => {
  const parent = React.useContext(AnimModeContext);
  const merged = React.useMemo<AnimModeConfig>(
    () => ({
      forward: value.forward ?? parent.forward ?? "slideshow",
      back: value.back ?? parent.back ?? "slideshow",
    }),
    [value.forward, value.back, parent.forward, parent.back]
  );
  return (
    <AnimModeContext.Provider value={merged}>
      {children}
    </AnimModeContext.Provider>
  );
};
export const useAnimMode = () => React.useContext(AnimModeContext);
