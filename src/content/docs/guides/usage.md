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
  routes
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
```

## Map route views

```tsx
import { RouterProvider, Routes, Route } from "./router";
function App() {
  return (
    <RouterProvider router={router}>
      <Routes>
        <Route name="Home" path="/" component={Home} />
        <Route name="About" path="/about" component={About} />
        <Route name="Products" path="/products" component={Products} />
        <Route name="Product" path="/products/:id" component={Product} />
        <Route name="ProductOverview" path="/products/:id/overview" component={ProductOverview} />
        <Route name="ProductSpecs" path="/products/:id/specs" component={ProductSpecs} />
        <Route name="ProductReviews" path="/products/:id/reviews" component={ProductReviews} />
        <Route name="Users" path="/users" component={Users} />
        <Route name="User" path="/users/:userId" component={User} />
      </Routes>
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





