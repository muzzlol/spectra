import {
  createRootRoute,
  createRouter,
  createRoute,
  Outlet,
} from "@tanstack/react-router";

import ExcalidrawComponent from "./pages/Excalidraw";

// Define the root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const excalidrawRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/excalidraw/$id",
  component: ExcalidrawComponent,
});

// Define route tree
const routeTree = rootRoute.addChildren([excalidrawRoute]);

// Create router instance
const router = createRouter({ routeTree });

// Export the router and routes for use elsewhere
export { router, rootRoute };
