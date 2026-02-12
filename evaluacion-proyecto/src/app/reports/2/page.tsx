import { getPrestamosVencidos } from "./actions";
import { Report2Schema } from "./squema";

export const dynamic = 'force-dynamic';

interface Reporte2PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Reporte2({ searchParams }: Reporte2PageProps) {
    const resolvedParams = await searchParams;
    
    const parsed = Report2Schema.safeParse(resolvedParams);

    if (!parsed.success) {
      return <div>Error en parámetros</div>;
    }

    const { ok, data, error } = await getPrestamosVencidos(parsed.data);

    if (!ok || !data) return <div>Error: {error}</div>;

    const { rows, totalRecords, totalPages, totalOverdue, avgDaysOverdue } = data;
    const params = parsed.data;

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