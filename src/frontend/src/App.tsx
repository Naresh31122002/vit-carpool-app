import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { PageLoader } from "./components/LoadingSpinner";

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CreateRidePage = lazy(() => import("./pages/CreateRidePage"));
const RideDetailPage = lazy(() => import("./pages/RideDetailPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const MyRidesPage = lazy(() => import("./pages/MyRidesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RequestsPage = lazy(() => import("./pages/RequestsPage"));

function isLoggedIn(): boolean {
  return !!localStorage.getItem("vit_session_token");
}

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

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SignupPage />
    </Suspense>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HomePage />
    </Suspense>
  ),
});

const createRideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CreateRidePage />
    </Suspense>
  ),
});

const rideDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ride/$rideId",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RideDetailPage />
    </Suspense>
  ),
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ChatPage />
    </Suspense>
  ),
});

const chatRideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat/$rideId",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ChatPage />
    </Suspense>
  ),
});

const myRidesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-rides",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <MyRidesPage />
    </Suspense>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ProfilePage />
    </Suspense>
  ),
});

const requestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests",
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: "/login" });
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RequestsPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
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
