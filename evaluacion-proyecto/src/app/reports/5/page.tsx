import { pool } from '../../../lib/db';
import { z } from 'zod';

type InventoryHealthRow = {
  category: string;
  total_ejemplares: number;
  disponibles: number;
  prestados: number;
  perdidos: number;
  porcentaje_disponibilidad: number;
  estado_salud: string;
};

const ALLOWED_STATES = ['Saludable', 'Alerta: Stock Bajo', 'Crítico: Muchas Pérdidas'];

const searchSchema = z.object({
  estado_salud: z.string().optional().refine(
    (val) => !val || ALLOWED_STATES.includes(val),
    { message: 'Estado de salud no válido' }
  ),
  disponibilidad_minima: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export const dynamic = 'force-dynamic';

export default async function Reporte5({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  const params = searchSchema.parse({
    estado_salud: resolvedParams.estado_salud,
    disponibilidad_minima: resolvedParams.disponibilidad_minima,
    page: resolvedParams.page,
    limit: resolvedParams.limit,
  });

  const offset = (params.page - 1) * params.limit;


  const whereClauses: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (params.estado_salud) {
    whereClauses.push(`estado_salud = $${paramIndex}`);
    queryParams.push(params.estado_salud);
    paramIndex++;
  }

  if (params.disponibilidad_minima !== undefined) {
    whereClauses.push(`porcentaje_disponibilidad >= $${paramIndex}`);
    queryParams.push(params.disponibilidad_minima);
    paramIndex++;
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';


  const result = await pool.query(
    `SELECT category, total_ejemplares, disponibles, prestados, perdidos, 
            porcentaje_disponibilidad, estado_salud
     FROM vw_inventory_health
     ${whereClause}
     ORDER BY porcentaje_disponibilidad ASC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, params.limit, offset]
  );


  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM vw_inventory_health ${whereClause}`,
    queryParams
  );

  const rows = result.rows as InventoryHealthRow[];
  const totalRecords = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalRecords / params.limit);


  const totalCopies = rows.reduce((acc, r) => acc + Number(r.total_ejemplares), 0);
  const totalAvailable = rows.reduce((acc, r) => acc + Number(r.disponibles), 0);
  const totalLost = rows.reduce((acc, r) => acc + Number(r.perdidos), 0);
  const avgAvailability = rows.length > 0 
    ? rows.reduce((acc, r) => acc + Number(r.porcentaje_disponibilidad), 0) / rows.length 
    : 0;
  const criticalCategories = rows.filter(r => r.estado_salud.includes('Crítico')).length;

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
