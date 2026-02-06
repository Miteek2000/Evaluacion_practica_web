# Lab Reportes - Next.js Dashboard con PostgreSQL

## Descripción del Proyecto

Aplicación Next.js que visualiza reportes de una biblioteca mediante VIEWS de PostgreSQL. La aplicación se ejecuta con Docker Compose y utiliza un usuario de base de datos con permisos mínimos (solo SELECT en vistas) para garantizar la seguridad.

### Reportes Implementados

1. **Libros Más Prestados** - Ranking de libros por número de préstamos con filtros por categoría
2. **Préstamos Vencidos** - Listado de préstamos con días de atraso y filtro por días mínimos
3. **Resumen Financiero de Multas** - Multas agrupadas por mes/año con totales pagados y pendientes
4. **Actividad de Socios** - Indicadores de fidelidad y puntualidad de socios con tasa de atraso
5. **Salud del Inventario** - Estado operativo de copias por categoría con porcentaje de disponibilidad

---

## Ejecutar el Proyecto

### Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd Evaluacion-practica-web
```

2. **Levantar los servicios**
```bash
docker compose up --build
```

La aplicación estará disponible en: `http://localhost:3000`

3. **Detener los servicios**
```bash
docker compose down
```

4. **Eliminar volúmenes (reiniciar base de datos)**
```bash
docker compose down -v
```

---

## Justificación de Índices

Se agregaron 3 índices para mejorar el rendimiento de las consultas en las vistas:

### 1. Índice en `loans.member_id`

```sql
CREATE INDEX idx_loans_member_id ON loans(member_id);
```

Este índice ayuda principalmente en la vista `vw_member_activity` porque hace más rápidos los JOINs con la tabla members. Básicamente cuando la vista necesita contar cuántos préstamos tiene cada socio, en lugar de recorrer toda la tabla, usa el índice para ir directo a los préstamos de ese socio específico.


### 2. Índice en `loans.copy_id`

```sql
CREATE INDEX idx_loans_copy_id ON loans(copy_id);
```

Este lo usan las vistas `vw_most_borrowed_books` y `vw_overdue_loans`. Como estas vistas hacen JOINs entre loans, copies, books, el índice permite encontrar rápidamente todos los préstamos de una copia específica sin tener que buscar en toda la tabla.


### 3. Índice parcial en `loans.due_at`

```sql
CREATE INDEX idx_loans_due_at_active ON loans(due_at)
WHERE returned_at IS NULL;
```

Este es un índice parcial que solo indexa los préstamos que aún no se han devuelto. Lo usé para la vista `vw_overdue_loans` porque esta vista solo necesita buscar préstamos activos que estén vencidos, entonces en vez de indexar TODOS los préstamos (incluyendo los ya devueltos), solo indexo los que importan. Esto hace el índice más pequeño y rápido.

---

## Configuración

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y configura tus variables de entorno:
   - `POSTGRES_USER`: Usuario de PostgreSQL
   - `POSTGRES_PASSWORD`: Contraseña segura
   - `POSTGRES_DB`: Nombre de la base de datos
   - `POSTGRES_PORT`: Puerto (por defecto 5436)

3. Inicia los contenedores:
   ```bash
   docker-compose up -d
   ```

---

## Configuración de Seguridad

La aplicación **NO** se conecta como usuario `postgres`. Se creó un usuario `app` con permisos mínimos.

### Usuario app

El usuario `app` tiene estos permisos:
- SELECT en las 5 vistas (vw_most_borrowed_books, vw_overdue_loans, etc.)
- CONNECT a la base de datos
- USAGE del schema public

Y NO tiene permisos para:
- Hacer SELECT en las tablas directamente
- INSERT, UPDATE o DELETE
- Crear objetos nuevos

Para probar que funciona:
```sql
\c library_db app

SELECT * FROM members;  -- esto da error
SELECT * FROM vw_most_borrowed_books LIMIT 5;  -- esto sí funciona
```

---

## Base de Datos

Los scripts SQL se ejecutan en orden cuando se levanta el contenedor por primera vez:

1. `01_schema.sql` - Define las tablas (books, members, copies, loans, fines)
2. `02_seed.sql` - Mete datos de ejemplo
3. `03_reports_vw.sql` - Crea las vistas para los reportes
4. `04_indexes.sql` - Agrega los índices
5. `05_roles.sql` - Crea el usuario app con permisos limitados
6. `06_migrate.sql` - (vacío por ahora, es para migraciones futuras)

### Vistas (VIEWS) Creadas

| Vista | Qué hace | Técnicas SQL usadas |
|-------|----------|---------------------|
| `vw_most_borrowed_books` | Muestra ranking de libros más prestados | Window Function, sin SELECT * |
| `vw_overdue_loans` | Lista préstamos vencidos con cálculo de mora | CTE (WITH), CASE, cálculos de fechas |
| `vw_fines_summary` | Resumen de multas por mes | HAVING, CASE, agregaciones |
| `vw_member_activity` | Actividad y puntualidad de cada socio | CASE, COALESCE, porcentajes |
| `vw_inventory_health` | Estado del inventario por categoría | CASE, COALESCE, porcentajes |

---

## Tecnologías Utilizadas

- Next.js 15 (usando App Router)
- PostgreSQL 16
- Zod para validaciones
- CSS + Tailwind
- Docker Compose