import { LinkProvider } from "@cloudflare/kumo";
import { RouterProvider } from "react-router-dom";

import { router } from "./router";
import { KumoRouterLink } from "./KumoLinkAdapter";

export function App() {
  return (
    <LinkProvider component={KumoRouterLink}>
      <RouterProvider router={router} />
    </LinkProvider>
  );
}

