import React from 'react';
import { CharactersView, CharacterView, EpisodesView, TopView } from './DrilldownAppScreens';
import { DrilldownViewer } from './DrilldownViewer';
import { getDepth, RouterProvider, Routes } from './router';

export const DrilldownApp: React.FC = () => {
  return (
    <RouterProvider>
      <div className="mx-auto">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
          <Routes
            viewer={props => <DrilldownViewer {...props} getDepth={getDepth} />}
            views={{
              Home: TopView,
              Characters: CharactersView,
              CharacterDetail: CharacterView as React.ComponentType<any>,
              Episodes: EpisodesView,
            }}
          />
        </div>
      </div>
    </RouterProvider>
  );
};

export default DrilldownApp;
