import { z } from "zod";

const ALLOWED_STATES = ['Saludable', 'Alerta: Stock Bajo', 'Crítico: Muchas Pérdidas'];

export const Report5Schema = z.object({
  estado_salud: z.string().optional().refine(
    (val) => !val || ALLOWED_STATES.includes(val),
    { message: 'Estado de salud no válido' }
  ),
  disponibilidad_minima: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export type Report5Input = z.infer<typeof Report5Schema>;

export { ALLOWED_STATES };
