import { pool } from '../../../lib/db';
import { z } from 'zod';

type MemberActivityRow = {
  member_id: number;
  socio: string;
  member_type: string;
  total_prestamos: number;
  prestamos_con_atraso: number;
  tasa_atraso_porcentaje: number;
  categoria_actividad: string;
};

const ALLOWED_TYPES = ['teacher', 'external', 'student'];
const ALLOWED_CATEGORIES = ['Socio Frecuente', 'Socio Ocasional', 'Inactivo'];

const searchSchema = z.object({
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

export const dynamic = 'force-dynamic';

export default async function Reporte4({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  const params = searchSchema.parse({
    member_type: resolvedParams.member_type,
    categoria_actividad: resolvedParams.categoria_actividad,
    tasa_minima: resolvedParams.tasa_minima,
    page: resolvedParams.page,
    limit: resolvedParams.limit,
  });

  const offset = (params.page - 1) * params.limit;

  const whereClauses: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (params.member_type) {
    whereClauses.push(`member_type = $${paramIndex}`);
    queryParams.push(params.member_type);
    paramIndex++;
  }

  if (params.categoria_actividad) {
    whereClauses.push(`categoria_actividad = $${paramIndex}`);
    queryParams.push(params.categoria_actividad);
    paramIndex++;
  }

  if (params.tasa_minima !== undefined) {
    whereClauses.push(`tasa_atraso_porcentaje >= $${paramIndex}`);
    queryParams.push(params.tasa_minima);
    paramIndex++;
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT member_id, socio, member_type, total_prestamos, prestamos_con_atraso, 
            tasa_atraso_porcentaje, categoria_actividad
     FROM vw_member_activity
     ${whereClause}
     ORDER BY total_prestamos DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, params.limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM vw_member_activity ${whereClause}`,
    queryParams
  );

  const rows = result.rows as MemberActivityRow[];
  const totalRecords = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalRecords / params.limit);


  const totalLoans = rows.reduce((acc, r) => acc + Number(r.total_prestamos), 0);
  const avgOverdueRate = rows.length > 0 
    ? rows.reduce((acc, r) => acc + Number(r.tasa_atraso_porcentaje), 0) / rows.length 
    : 0;
  const activeMembers = rows.filter(r => r.categoria_actividad === 'Socio Frecuente').length;

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
