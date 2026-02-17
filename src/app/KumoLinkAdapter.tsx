import { forwardRef } from "react";
import { Link as RouterLink } from "react-router-dom";

type KumoLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & { to?: string };

/**
 * Adapter for Kumo's `LinkProvider`.
 *
 * Kumo expects `to` to be optional (it may render non-link elements in some cases).
 * React Router's `Link` requires `to`, so we provide a harmless fallback.
 */
export const KumoRouterLink = forwardRef<HTMLAnchorElement, KumoLinkProps>(
  function KumoRouterLink({ to, ...rest }, ref) {
    return <RouterLink ref={ref} to={to ?? "#"} {...rest} />;
  },
);

