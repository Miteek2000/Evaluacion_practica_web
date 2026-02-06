import { pool } from '../../../lib/db';
import { z } from 'zod';

type OverdueRow = {
    loan_id: number;
    member_name: string;
    book_title: string;
    due_at: string;
    returned_at: string | null;
    dias_atraso: number;
}

const searchSchema = z.object({
  dias_minimos: z.coerce.number().int().min(0).max(365).default(0),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export const dynamic = 'force-dynamic';

export default async function Reporte2({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    
    const params = searchSchema.parse({
      dias_minimos: resolvedParams.dias_minimos,
      page: resolvedParams.page,
      limit: resolvedParams.limit,
    });

    const offset = (params.page - 1) * params.limit;

    
    const result = await pool.query(
        `SELECT loan_id, member_name, book_title, due_at, returned_at, dias_atraso
        FROM vw_overdue_loans
        WHERE dias_atraso >= $1
        ORDER BY dias_atraso DESC
        LIMIT $2 OFFSET $3`,
        [params.dias_minimos, params.limit, offset]
    );

   
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM vw_overdue_loans WHERE dias_atraso >= $1`,
      [params.dias_minimos]
    );

    const rows = result.rows as OverdueRow[];
    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / params.limit);

    const totalOverdue = rows.length;
    const avgDaysOverdue = rows.reduce((acc, r) => acc + r.dias_atraso, 0) / (totalOverdue || 1);

    return (
        <main className="main-container">
            <div className="page-header">
                <h1 className="page-title">Préstamos Vencidos o Devueltos Tarde</h1>
                <p className="page-description">Listado de préstamos con días de atraso.</p>
            </div>

            {}
            <div className="filter-container">
              <form method="get" className="filter-form-inline">
                <div className="form-group">
                  <label className="form-label">Días mínimos de atraso:</label>
                  <input type="number" name="dias_minimos" defaultValue={params.dias_minimos} min="0" max="365"
                         className="form-input" style={{ width: '120px' }} />
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
                    <p className="kpi-value">{totalOverdue.toLocaleString()}</p>
                </div>
                <div className="kpi-item">
                    <p className="kpi-label">Días Promedio de Atraso</p>
                    <p className="kpi-value">{avgDaysOverdue.toFixed(2)}</p>
                </div>
                <div className="kpi-item">
                    <p className="kpi-label">Total Registros</p>
                    <p className="kpi-value">{totalRecords}</p>
                </div>
            </div>

            <table className="report-table">
                <thead>
                    <tr>
                        <th className="table-center">ID Préstamo</th>
                        <th>Nombre Socio</th>
                        <th>Título Libro</th>
                        <th className="table-center">Fecha Vencimiento</th>
                        <th className="table-center">Fecha Devolución</th>
                        <th className="table-right">Días de Atraso</th>
                        </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.loan_id}>
                            <td className="table-center">{row.loan_id}</td>
                            <td>{row.member_name}</td>
                            <td>{row.book_title}</td>
                            <td className="table-center">{new Date(row.due_at).toLocaleDateString()}</td>
                            <td className="table-center">{row.returned_at ? new Date(row.returned_at).toLocaleDateString() : 'No devuelto'}</td>
                            <td className="table-right">{row.dias_atraso}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {}
            {totalPages > 1 && (
              <div className="pagination">
                {params.page > 1 && (
                  <a href={`?dias_minimos=${params.dias_minimos}&limit=${params.limit}&page=${params.page - 1}`}
                     className="pagination-link">
                    ← Anterior
                  </a>
                )}
                <span className="pagination-info">Página {params.page} de {totalPages}</span>
                {params.page < totalPages && (
                  <a href={`?dias_minimos=${params.dias_minimos}&limit=${params.limit}&page=${params.page + 1}`}
                     className="pagination-link">
                    Siguiente →
                  </a>
                )}
              </div>
            )}
        </main>
    )
}