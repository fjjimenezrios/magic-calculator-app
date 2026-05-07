import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Calculator } from "@/components/Calculator";

const searchSchema = z.object({
  skin: z.enum(["ios", "android"]).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  component: Calculator,
});
