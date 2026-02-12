import { getLibrosMasPrestados } from "./actions";
import { Report1Schema, ALLOWED_CATEGORIES } from "./squema";

export const dynamic = 'force-dynamic';

interface Reporte1PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Reporte1({ searchParams }: Reporte1PageProps) {
  const resolvedParams = await searchParams;
  
  const parsed = Report1Schema.safeParse(resolvedParams);

  if (!parsed.success) {
    return <div>Error en parámetros</div>;
  }

  const { ok, data, error } = await getLibrosMasPrestados(parsed.data);

  if (!ok || !data) return <div>Error: {error}</div>;

  const { rows, totalRecords, totalPages, totalLoans, topBook } = data;
  const params = parsed.data;

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
        