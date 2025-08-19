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
  // Keys come from route names (optionally with ":id=..." suffix)
  if (/^CharacterDetail(\b|:)/i.test(key)) return 2;
  if (/^(Characters|Episodes)(\b|:)/i.test(key)) return 1;
  if (/^Home(\b|:)/i.test(key)) return 0;
  return 0;
}

export type LinkProps = React.ComponentProps<typeof Link>;
export type RouteName = LinkProps["name"];
