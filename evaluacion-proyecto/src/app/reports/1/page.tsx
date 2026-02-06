import { pool } from '../../../lib/db';
import { z } from 'zod';

type BookRow = {
  book_id: number;
  titulo_libro: string;
  autor_libro: string;
  categoria: string;
  total_prestamos: number;
  posicion_ranking: number;
};


const ALLOWED_CATEGORIES = ['Novela', 'Distopía', 'Fábula', 'Tecnología', 'Clásico', 'Historia', 'Fantasía'];


const searchSchema = z.object({
  categoria: z.string().optional().refine(
    (val) => !val || ALLOWED_CATEGORIES.includes(val),
    { message: 'Categoría no válida' }
  ),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export const dynamic = 'force-dynamic';

export default async function Reporte1({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  const params = searchSchema.parse({
    categoria: resolvedParams.categoria,
    page: resolvedParams.page,
    limit: resolvedParams.limit,
  });

  const offset = (params.page - 1) * params.limit;

  
  const whereClause = params.categoria ? 'WHERE categoria = $1' : '';
  const queryParams = params.categoria ? [params.categoria, params.limit, offset] : [params.limit, offset];
  const paramStart = params.categoria ? 2 : 1;

  const result = await pool.query(
    `SELECT book_id, titulo_libro, autor_libro, categoria, total_prestamos, posicion_ranking
     FROM vw_most_borrowed_books
     ${whereClause}
     ORDER BY total_prestamos DESC
     LIMIT $${paramStart} OFFSET $${paramStart + 1}`,
    queryParams
  );

  
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM vw_most_borrowed_books ${whereClause}`,
    params.categoria ? [params.categoria] : []
  );

  const rows = result.rows as BookRow[];
  const totalRecords = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalRecords / params.limit);
  const totalLoans = rows.reduce((acc, r) => acc + Number(r.total_prestamos), 0);
  const topBook = rows[0] ?? null;

  return (
    <main className="main-container">
      <div className="page-header">
        <h1 className="page-title">Libros Más Prestados</h1>
        <p className="page-description">Top de libros por número de préstamos (período definido en la vista).</p>
      </div>

      {}
      <div className="filter-container">
        <form method="get" className="filter-form-inline">
          <div className="form-group">
            <label className="form-label">Categoría:</label>
            <select name="categoria" defaultValue={params.categoria || ''} className="form-select">
              <option value="">Todas</option>
              {ALLOWED_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Por página:</label>
            <select name="limit" defaultValue={params.limit} className="form-select">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
        </form>
      </div>

      <div className="kpi-container">
        <div className="kpi-item">
          <p className="kpi-label">Total Préstamos (Página {params.page})</p>
          <p className="kpi-value">{totalLoans.toLocaleString()}</p>
        </div>
        {topBook && (
          <div className="kpi-item">
            <p className="kpi-label">Libro Top: {topBook.titulo_libro}</p>
            <p className="kpi-value">{topBook.total_prestamos.toLocaleString()} préstamos</p>

      {}
      {totalPages > 1 && (
        <div className="pagination">
          {params.page > 1 && (
            <a href={`?categoria=${params.categoria || ''}&limit=${params.limit}&page=${params.page - 1}`} 
               className="pagination-link">
              ← Anterior
            </a>
          )}
          <span className="pagination-info">Página {params.page} de {totalPages}</span>
          {params.page < totalPages && (
            <a href={`?categoria=${params.categoria || ''}&limit=${params.limit}&page=${params.page + 1}`}
               className="pagination-link">
              Siguiente →
            </a>
          )}
        </div>
      )}
          </div>
        )}
        <div className="kpi-item">
          <p className="kpi-label">Total Registros</p>
          <p className="kpi-value">{totalRecords}</p>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th className="table-center">Rank</th>
            <th>Título</th>
            <th>Autor</th>
            <th>Categoría</th>
            <th className="table-right">Total Préstamos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.book_id}>
              <td className="table-center">{row.posicion_ranking}</td>
              <td>{row.titulo_libro}</td>
              <td>{row.autor_libro}</td>
              <td>{row.categoria}</td>
              <td className="table-right">{Number(row.total_prestamos).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
        