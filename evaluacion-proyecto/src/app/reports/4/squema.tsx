import { z } from "zod";

const ALLOWED_TYPES = ['teacher', 'external', 'student'];
const ALLOWED_CATEGORIES = ['Socio Frecuente', 'Socio Ocasional', 'Inactivo'];

export const Report4Schema = z.object({
  member_type: z.string().optional().refine(
    (val) => !val || ALLOWED_TYPES.includes(val),
    { message: 'Tipo de socio no válido' }
  ),
  categoria_actividad: z.string().optional().refine(
    (val) => !val || ALLOWED_CATEGORIES.includes(val),
    { message: 'Categoría de actividad no válida' }
  ),
  tasa_minima: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export type Report4Input = z.infer<typeof Report4Schema>;

export { ALLOWED_TYPES, ALLOWED_CATEGORIES };
