import { z } from "zod";

export const Report2Schema = z.object({
  dias_minimos: z.coerce.number().int().min(0).max(365).default(0),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export type Report2Input = z.infer<typeof Report2Schema>;
