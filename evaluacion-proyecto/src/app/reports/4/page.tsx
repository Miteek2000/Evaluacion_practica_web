import { getActividadSocios } from "./actions";
import { Report4Schema, ALLOWED_TYPES, ALLOWED_CATEGORIES } from "./squema";

export const dynamic = 'force-dynamic';

interface Reporte4PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Reporte4({ searchParams }: Reporte4PageProps) {
  const resolvedParams = await searchParams;
  
  const parsed = Report4Schema.safeParse(resolvedParams);

  if (!parsed.success) {
    return <div>Error en parámetros</div>;
  }

  const { ok, data, error } = await getActividadSocios(parsed.data);

  if (!ok || !data) return <div>Error: {error}</div>;

  const { rows, totalRecords, totalPages, totalLoans, avgOverdueRate, activeMembers } = data;
  const params = parsed.data;

  return (
    <main className="main-container">
      <div className="page-header">
        <h1 className="page-title">Actividad de Socios</h1>
        <p className="page-description">Indicadores de fidelidad y puntualidad de los socios de la biblioteca.</p>
      </div>

      {}
      <div className="filter-container">
        <form method="get" className="filter-form-inline">
          <div className="form-group">
            <label className="form-label">Tipo de Socio:</label>
            <select name="member_type" defaultValue={params.member_type || ''} className="form-select">
              <option value="">Todos</option>
              {ALLOWED_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Categoría de Actividad:</label>
            <select name="categoria_actividad" defaultValue={params.categoria_actividad || ''} className="form-select">
              <option value="">Todas</option>
              {ALLOWED_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tasa mínima de atraso (%):</label>
            <input type="number" name="tasa_minima" defaultValue={params.tasa_minima} min="0" max="100" step="0.01"
                   placeholder="0-100" className="form-input" style={{ width: '120px' }} />
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

      {}
      <div className="kpi-container">
        <div className="kpi-item">
          <p className="kpi-label">Total Préstamos (Página {params.page})</p>
          <p className="kpi-value">{totalLoans.toLocaleString()}</p>
        </div>
        <div className="kpi-item">
          <p className="kpi-label">Tasa Promedio de Atraso</p>
          <p className="kpi-value">{avgOverdueRate.toFixed(2)}%</p>
        </div>
        <div className="kpi-item">
          <p className="kpi-label">Socios Frecuentes</p>
          <p className="kpi-value">{activeMembers}</p>
        </div>
        <div className="kpi-item">
          <p className="kpi-label">Total Registros</p>
          <p className="kpi-value">{totalRecords}</p>
        </div>
      </div>

      {}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Socio</th>
              <th>Tipo</th>
              <th>Total Préstamos</th>
              <th>Préstamos con Atraso</th>
              <th>Tasa de Atraso (%)</th>
              <th>Categoría de Actividad</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No se encontraron registros con los filtros aplicados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.member_id}>
                  <td>{row.member_id}</td>
                  <td>{row.socio}</td>
                  <td>
                    <span className={`badge ${row.member_type === 'premium' ? 'badge-premium' : row.member_type === 'estudiante' ? 'badge-estudiante' : 'badge-regular'}`}>
                      {row.member_type}
                    </span>
                  </td>
                  <td>{row.total_prestamos}</td>
                  <td>{row.prestamos_con_atraso}</td>
                  <td>
                    <span className={row.tasa_atraso_porcentaje > 50 ? 'text-danger' : row.tasa_atraso_porcentaje > 25 ? 'text-warning' : 'text-success'}>
                      {row.tasa_atraso_porcentaje}%
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${row.categoria_actividad === 'Socio Frecuente' ? 'badge-success' : row.categoria_actividad === 'Socio Ocasional' ? 'badge-warning' : 'badge-gray'}`}>
                      {row.categoria_actividad}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {}
      {totalPages > 1 && (
        <div className="pagination">
          {params.page > 1 && (
            <a href={`?${new URLSearchParams({ 
              ...(params.member_type && { member_type: params.member_type }),
              ...(params.categoria_actividad && { categoria_actividad: params.categoria_actividad }),
              ...(params.tasa_minima !== undefined && { tasa_minima: params.tasa_minima.toString() }),
              page: (params.page - 1).toString(),
              limit: params.limit.toString()
            })}`} className="pagination-link">
              ← Anterior
            </a>
          )}
          <span className="pagination-info">
            Página {params.page} de {totalPages}
          </span>
          {params.page < totalPages && (
            <a href={`?${new URLSearchParams({ 
              ...(params.member_type && { member_type: params.member_type }),
              ...(params.categoria_actividad && { categoria_actividad: params.categoria_actividad }),
              ...(params.tasa_minima !== undefined && { tasa_minima: params.tasa_minima.toString() }),
              page: (params.page + 1).toString(),
              limit: params.limit.toString()
            })}`} className="pagination-link">
              Siguiente →
            </a>
          )}
        </div>
      )}
    </main>
  );
}
