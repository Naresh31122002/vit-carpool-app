import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { PageLoader } from "./components/LoadingSpinner";

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CreateRidePage = lazy(() => import("./pages/CreateRidePage"));
const RideDetailPage = lazy(() => import("./pages/RideDetailPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const MyRidesPage = lazy(() => import("./pages/MyRidesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RequestsPage = lazy(() => import("./pages/RequestsPage"));

const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <LoginPage />
    </Suspense>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HomePage />
    </Suspense>
  ),
});

const createRideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CreateRidePage />
    </Suspense>
  ),
});

const rideDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ride/$rideId",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RideDetailPage />
    </Suspense>
  ),
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ChatPage />
    </Suspense>
  ),
});

const chatRideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat/$rideId",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ChatPage />
    </Suspense>
  ),
});

const myRidesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-rides",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <MyRidesPage />
    </Suspense>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ProfilePage />
    </Suspense>
  ),
});

const requestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RequestsPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  homeRoute,
  createRideRoute,
  rideDetailRoute,
  chatRoute,
  chatRideRoute,
  myRidesRoute,
  profileRoute,
  requestsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
