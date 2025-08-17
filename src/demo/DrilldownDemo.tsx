import React from "react";
import { createRouter } from "../lib/create-router";
import { RTCViewer, DebugVisProvider, AnimModeProvider } from "./viewers";
import "./transitions.css";

// Screens specific to Drilldown
const Home: React.FC = () => (
  <div className="rounded-xl border border-black/10 dark:border-white/10 bg-rose-50 text-slate-900 dark:bg-rose-900 dark:text-slate-100 shadow-sm p-4">
    <h3 className="text-xl font-semibold mb-2">Home</h3>
    <p>Welcome. Try Users → Andy to see a drilldown.</p>
  </div>
);

const UsersList: React.FC = () => (
  <div className="rounded-xl border border-black/10 dark:border-white/10 bg-emerald-50 text-slate-900 dark:bg-emerald-900 dark:text-slate-100 shadow-sm p-4">
    <h3 className="text-lg font-semibold mb-2">Users</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li><Link name="UserDetail" params={{ userId: "andy" }}>Andy</Link></li>
      <li><Link name="UserDetail" params={{ userId: "betty" }}>Betty</Link></li>
      <li><Link name="UserDetail" params={{ userId: "carlos" }}>Carlos</Link></li>
    </ul>
  </div>
);

const UserDetail: React.FC<{ userId: string; }> = ({ userId }) => {
  const { from } = useRouter();
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-blue-50 text-slate-900 dark:bg-blue-900 dark:text-slate-100 shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-2">User: {userId}</h3>
      <p className="mb-2">This view overlays the list with a smooth parallel transition.</p>
      <p className="text-xs opacity-70">From: {from?.name ?? "(none)"}</p>
    </div>
  );
};

// Users shell keeps list mounted and transitions detail in/out above it
const UsersShell: React.FC = () => {
  // Map both list and detail to this shell so shell owns both states
  const views = {
    Users: UsersList,
    UserDetail: UsersList,
  } as const;
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
        <h3 className="text-xl font-semibold">Users</h3>
      </div>
      <div className="p-4">
        <Routes viewer={RTCViewer} views={views as any} />
      </div>
    </div>
  );
};

// Detail layer: only body, layout provided by a RouteLayouts mapping below
const DetailBody: React.FC<{ userId: string; }> = ({ userId }) => (
  <div className="overflow-hidden">
    <UserDetail userId={userId} />
  </div>
);

// Self-contained router instance for this demo (no react-router)
const { RouterProvider, Routes, Link, useRouter } = createRouter({
  Home: "/",
  Users: "/users",
  UserDetail: "/users/:userId",
}, {
  useHash: true,
});

export const DrilldownDemo: React.FC = () => {
  const [debugVis, setDebugVis] = React.useState(false);
  const [mode, setMode] = React.useState<'fade' | 'slide' | 'slideshow' | 'circle' | 'gradient'>('slide');
  const [durationSec, setDurationSec] = React.useState<number>(0.35);
  const durationMs = Math.max(0, Math.round(durationSec * 1000));

  return (
    <RouterProvider>
      <DebugVisProvider value={debugVis}>
        <div className="p-2" style={{ ["--vt-duration" as any]: `${durationMs}ms` }}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-semibold">Drilldown Demo (RTC)</h2>
            <button
              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-neutral-700 active:bg-slate-300 dark:active:bg-neutral-600"
              onClick={() => setDebugVis((v) => !v)}
              aria-pressed={debugVis}
            >
              {debugVis ? 'Disable Debug' : 'Enable Debug'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <label className="text-sm flex items-center gap-2">
              <span>Mode</span>
              <select
                className="rounded border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
              >
                <option value="fade">fade</option>
                <option value="slide">slide</option>
                <option value="slideshow">slideshow</option>
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
                onChange={(e) => setDurationSec(parseFloat(e.target.value) || 0)}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 shadow-sm backdrop-blur">
            <div className="px-4 pt-4">
              <nav className="flex flex-wrap gap-2 mb-3">
                <Link name="Home">Home</Link>
                <Link name="Users">Users</Link>
                <Link name="UserDetail" params={{ userId: "andy" }}>User: andy</Link>
              </nav>
            </div>
            <div className="p-4">
              <AnimModeProvider value={{ forward: mode, back: mode }}>
                {/* Top-level routes with a shell for Users */}
                <Routes
                  viewer={RTCViewer}
                  keep={1}
                  views={{
                    Home,
                    Users: UsersShell,
                    // Route layouts for detail push that keep shell visible
                    UserDetail: UsersShell,
                  }}
                />
                {/* Nested level for detail area only; this emulates the drilldown push */}
                <div className="mt-4">
                  <Routes
                    viewer={RTCViewer}
                    keep={0}
                    views={{
                      Home: () => null,
                      Users: () => null,
                      UserDetail: DetailBody,
                    }}
                  />
                </div>
              </AnimModeProvider>
            </div>
          </div>
        </div>
      </DebugVisProvider>
    </RouterProvider>
  );
};

export default DrilldownDemo;
