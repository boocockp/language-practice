import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RootErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <section>
        <h1>Something went wrong</h1>
        <p>
          {error.status} {error.statusText}
        </p>
      </section>
    );
  }

  const message =
    error instanceof Error ? error.message : "An unknown error occurred.";

  return (
    <section>
      <h1>Something went wrong</h1>
      <p>{message}</p>
    </section>
  );
}

