import { z } from "zod";

export const Report3Schema = z.object({
  pendientes_solo: z.enum(['true', 'false']).optional().default('false'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export type Report3Input = z.infer<typeof Report3Schema>;
