import { createRouter } from "../../lib/create-router";

export const {
  RouterProvider,
  RouterSnapshotProvider,
  Routes,
  Route,
  Outlet,
  Link,
  useRouter,
  useRoute,
  useNavigation,
  store,
  history,
  routes: routeDefs,
} = createRouter({
  Home: "/",
  About: "/about",
  Products: "/products",
  Product: "/products/:id",
  ProductOverview: "/products/:id/overview",
  ProductSpecs: "/products/:id/specs",
  ProductReviews: "/products/:id/reviews",
  Users: "/users",
  User: "/users/:userId",
}, {
  useHash: true,
});
