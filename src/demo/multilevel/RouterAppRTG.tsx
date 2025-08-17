import React from "react";
import { ViewerProvider } from "../../lib/route-viewer";
import {
  DEFAULT_TRANSITION_DURATION,
  DEFAULT_TRANSITION_MODE,
} from "../config";
import { DebugVisProvider } from "./DebugVisContext";
import { Link, RouterProvider, Routes } from "./router";
import { About, DebugPanel, Home, Products, User } from "./RouterAppScreens";
import { RTGViewer } from "./RTGViewer";
import "./transitions.css";
import { AnimModeProvider } from "./useAnimMode";

export const RouterAppRTG: React.FC = () => {
  const [debugVis, setDebugVis] = React.useState(false);
  const [mode, setMode] = React.useState<
    "slideshow" | "slide" | "circle" | "gradient"
  >(DEFAULT_TRANSITION_MODE);
  const [durationSec, setDurationSec] = React.useState<number>(
    DEFAULT_TRANSITION_DURATION
  );
  const durationMs = Math.max(0, Math.round(durationSec * 1000));
  return (
    <RouterProvider>
      <DebugVisProvider value={debugVis}>
        <div
          className="p-2"
          style={{ ["--vt-duration" as any]: `${durationMs}ms` }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-semibold">Idiomatic Router Demo</h2>
            <button
              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-neutral-700 active:bg-slate-300 dark:active:bg-neutral-600"
              onClick={() => setDebugVis((v) => !v)}
              aria-pressed={debugVis}
            >
              {debugVis ? "Disable Debug" : "Enable Debug"}
            </button>
          </div>
          {/* Controls: transition mode + duration */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <label className="text-sm flex items-center gap-2">
              <span>Mode</span>
              <select
                className="rounded border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
              >
                <option value="fade">fade</option>
                <option value="slideshow">slideshow</option>
                <option value="slide">slide</option>
                <option value="circle">circle</option>
                <option value="gradient">gradient</option>
              </select>
            </label>
            <label className="text-sm flex items-center gap-2">
              <span>Duration (s)</span>
              <input
                type="number"
                step="0.05"
                min="0"
                className="w-24 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                value={durationSec}
                onChange={(e) =>
                  setDurationSec(parseFloat(e.target.value) || 0)
                }
              />
            </label>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 shadow-sm backdrop-blur">
            <div className="px-4 pt-4">
              <nav className="flex flex-wrap gap-2 mb-3">
                <Link name="Home">Home</Link>
                <Link name="About">About</Link>
                <Link name="Products">Products</Link>
                <Link name="ProductOverview" params={{ id: "42" }}>
                  Product 42
                </Link>
                <Link name="User" params={{ userId: "winston" }}>
                  User winston
                </Link>
              </nav>
            </div>
            <div>
              <div className="p-4">
                <AnimModeProvider value={{ forward: mode, back: mode }}>
                  <ViewerProvider value={RTGViewer}>
                    <Routes
                      viewer={RTGViewer}
                      keep={1}
                      views={{
                        Home,
                        About,
                        Products,
                        User,
                        // Ensure site-level shell shows when inside product routes
                        Product: Products,
                        ProductOverview: Products,
                        ProductSpecs: Products,
                        ProductReviews: Products,
                      }}
                    />
                  </ViewerProvider>
                </AnimModeProvider>
              </div>
            </div>
            <div className="px-4 pb-4">
              <DebugPanel />
            </div>
          </div>
        </div>
      </DebugVisProvider>
    </RouterProvider>
  );
};
