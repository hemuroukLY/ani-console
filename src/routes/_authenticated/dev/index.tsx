import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dev/")({
  beforeLoad: () => {
    throw redirect({ to: "/dev/resource", replace: true });
  },
});
