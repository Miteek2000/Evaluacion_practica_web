import { getSaludInventario } from "./actions";
import { Report5Schema, ALLOWED_STATES } from "./squema";

export const dynamic = 'force-dynamic';

interface Reporte5PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Reporte5({ searchParams }: Reporte5PageProps) {
  const resolvedParams = await searchParams;
  
  const parsed = Report5Schema.safeParse(resolvedParams);

  if (!parsed.success) {
    return <div>Error en parámetros</div>;
  }

  const { ok, data, error } = await getSaludInventario(parsed.data);

  if (!ok || !data) return <div>Error: {error}</div>;

  const { rows, totalRecords, totalPages, totalCopies, totalAvailable, totalLost, avgAvailability, criticalCategories } = data;
  const params = parsed.data;

  return (
    <main className="main-container">
      <div className="page-header">
        <h1 className="page-title">Salud del Inventario</h1>
        <p className="page-description">Estado operativo de las copias de libros agrupadas por categoría.</p>
      </div>

      {}
      <div className="filter-container">
        <form method="get" className="filter-form-inline">
          <div className="form-group">
            <label className="form-label">Estado de Salud:</label>
            <select name="estado_salud" defaultValue={params.estado_salud || ''} className="form-select" style={{ minWidth: '200px' }}>
              <option value="">Todos</option>
              {ALLOWED_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Disponibilidad mínima (%):</label>
            <input type="number" name="disponibilidad_minima" defaultValue={params.disponibilidad_minima} 
                   min="0" max="100" step="0.01" placeholder="0-100"
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

      {}
      <div className="kpi-container">
        <div className="kpi-item">
          <p className="kpi-label">Total Ejemplares (Página {params.page})</p>
          <p className="kpi-value">{totalCopies.toLocaleString()}</p>
        </div>
        <div className="kpi-item">
          <p className="kpi-label">Ejemplares Disponibles</p>
          <p className="kpi-value text-success">{totalAvailable}</p>
        </div>
        <div className="kpi-item">
          <p className="kpi-label">Ejemplares Perdidos</p>
          <p className="kpi-value text-danger">{totalLost}</p>
        </div>
        <div className="kpi-item">
          <p className="kpi-label">Disponibilidad Promedio</p>
          <p className="kpi-value">{avgAvailability.toFixed(2)}%</p>
        </div>
        <div className="kpi-item">
          <p className="kpi-label">Categorías Críticas</p>
          <p className={`kpi-value ${criticalCategories > 0 ? 'text-danger' : 'text-success'}`}>
            {criticalCategories}
          </p>
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
              <th>Categoría</th>
              <th>Total Ejemplares</th>
              <th>Disponibles</th>
              <th>Prestados</th>
              <th>Perdidos</th>
              <th>% Disponibilidad</th>
              <th>Estado de Salud</th>
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
                <tr key={row.category}>
                  <td style={{ fontWeight: 'bold' }}>{row.category}</td>
                  <td>{row.total_ejemplares}</td>
                  <td>
                    <span className="text-muted">
                      {row.disponibles}
                    </span>
                  </td>
                  <td>
                    <span className="text-muted">
                      {row.prestados}
                    </span>
                  </td>
                  <td>
                    <span className="text-muted">
                      {row.perdidos}
                    </span>
                  </td>
                  <td>
                    <span className={row.porcentaje_disponibilidad < 20 ? 'text-danger' : row.porcentaje_disponibilidad < 50 ? 'text-warning' : 'text-success'}>
                      {row.porcentaje_disponibilidad}%
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      row.estado_salud === 'Saludable' ? 'badge-success' : 
                      row.estado_salud.includes('Alerta') ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {row.estado_salud}
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
              ...(params.estado_salud && { estado_salud: params.estado_salud }),
              ...(params.disponibilidad_minima !== undefined && { disponibilidad_minima: params.disponibilidad_minima.toString() }),
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
              ...(params.estado_salud && { estado_salud: params.estado_salud }),
              ...(params.disponibilidad_minima !== undefined && { disponibilidad_minima: params.disponibilidad_minima.toString() }),
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
