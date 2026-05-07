import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "@/components/Calculator";

export const Route = createFileRoute("/")({
  component: Calculator,
});
