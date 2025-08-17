import { createRouter } from "../../lib/create-router";

// Local, self-contained router instance for this demo
export const { RouterProvider, Link, useRouter, Routes, Route } = createRouter(
  {
    Home: "/",
    Characters: "/characters",
    CharacterDetail: "/characters/:id",
    Episodes: "/episodes",
  },
  { useHash: true }
);

export function getDepth(key?: string | null): number {
  if (!key) return 0;
  if (/CharacterView$/i.test(key)) return 2;
  if (/(CharactersView|EpisodesView)$/i.test(key)) return 1;
  if (/(TopView|Home)$/i.test(key)) return 0;
  return 0;
}

export type LinkProps = React.ComponentProps<typeof Link>;
export type RouteName = LinkProps["name"];
