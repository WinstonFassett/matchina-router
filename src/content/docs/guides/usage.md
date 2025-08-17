---
title: Usage with React
---

## Create a typesafe router

```ts
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
  routes,
} = createRouter(
  {
    Home: "/",
    About: "/about",
    Users: "/users",
    User: "/users/:userId",
  },
  {
    useHash: true,
  }
);
```

## Map route views

```tsx
import { RouterProvider, Routes, Route } from "./router";
function App() {
  return (
    <RouterProvider router={router}>
      <Routes
        viewer={RTGViewer}
        views={{
          Home,
          About,
          Users,
          User,
        }}
      />
    </RouterProvider>
  );
}
```

## Access navigation state

```tsx
function Home() {
  const { from, to } = useRouter();
  return (
    <div>
      <p>From: {from?.name}</p>
      <p>To: {to?.name}</p>
    </div>
  );
}
```

## Navigate

### Using `Link`

```tsx
function Home() {
  return (
    <div>
      <Link to="/about">About</Link>
      <Link to="/products/1">Product 1</Link>
      <Link to="/products/2">Product 2</Link>
    </div>
  );
}
```

### Using `goto()`

```tsx
function Home() {
  const { goto } = useRouter();
  return (
    <div>
      <button onClick={() => goto("/about")}>About</button>
      <button onClick={() => goto("/products/1")}>Product 1</button>
      <button onClick={() => goto("/products/2")}>Product 2</button>
    </div>
  );
}
```
