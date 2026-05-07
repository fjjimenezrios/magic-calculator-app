import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "@/components/Calculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculator" },
      { name: "description", content: "Calculator" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
    ],
  }),
  component: Calculator,
});
