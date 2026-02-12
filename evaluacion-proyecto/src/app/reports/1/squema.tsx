import { z } from "zod";

const ALLOWED_CATEGORIES = ['Novela', 'Distopía', 'Fábula', 'Tecnología', 'Clásico', 'Historia', 'Fantasía'];

export const Report1Schema = z.object({
  categoria: z.string().optional().refine(
    (val) => !val || ALLOWED_CATEGORIES.includes(val),
    { message: 'Categoría no válida' }
  ),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export type Report1Input = z.infer<typeof Report1Schema>;

export { ALLOWED_CATEGORIES };
