import { pool } from '../../../lib/db';
import { z } from 'zod';

type FinesSummaryRow = {
    mes_periodo: string;
    total_multas: number;
    total_pagado: number;
    total_pendiente: number;
    monto_total_generado: number;
}


const searchSchema = z.object({
  pendientes_solo: z.enum(['true', 'false']).optional().default('false'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
});

export const dynamic = 'force-dynamic';

export default async function Reporte3({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    
    const params = searchSchema.parse({
      pendientes_solo: resolvedParams.pendientes_solo,
      page: resolvedParams.page,
      limit: resolvedParams.limit,
    });

    const offset = (params.page - 1) * params.limit;

    const whereClause = params.pendientes_solo === 'true' ? 'WHERE total_pendiente > 0' : '';
    const queryParams = params.pendientes_solo === 'true' ? [params.limit, offset] : [params.limit, offset];

    const result = await pool.query(
        `SELECT mes_periodo, total_multas, total_pagado, total_pendiente, monto_total_generado
        FROM vw_fines_summary
        ${whereClause}
        ORDER BY mes_periodo DESC
        LIMIT $1 OFFSET $2`,
        queryParams
    );

   
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM vw_fines_summary ${whereClause}`
    );

    const rows = result.rows as FinesSummaryRow[];
    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / params.limit);

   
    const totalPagado = rows.reduce((acc, r) => acc + Number(r.total_pagado), 0);
    const totalPendiente = rows.reduce((acc, r) => acc + Number(r.total_pendiente), 0);
    const totalGenerado = rows.reduce((acc, r) => acc + Number(r.monto_total_generado), 0);

    return (
        <main className="main-container">
            <div className="page-header">
                <h1 className="page-title">Resumen Financiero de Multas</h1>
                <p className="page-description">Multas agrupadas por mes/año con totales pagados y pendientes.</p>
            </div>

            {}
            <div className="filter-container">
              <form method="get" className="filter-form-inline">
                <div className="form-group">
                  <label className="form-label">Filtrar por:</label>
                  <select name="pendientes_solo" defaultValue={params.pendientes_solo} className="form-select">
                    <option value="false">Todos los meses</option>
                    <option value="true">Solo con pendientes</option>
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
                    <p className="kpi-label">Total Pagado (Página {params.page})</p>
                    <p className="kpi-value">${totalPagado.toFixed(2)}</p>
                </div>
                <div className="kpi-item">
                    <p className="kpi-label">Total Pendiente</p>
                    <p className="kpi-value" style={{ color: totalPendiente > 0 ? '#d32f2f' : undefined }}>
                        ${totalPendiente.toFixed(2)}
                    </p>
                </div>
                <div className="kpi-item">
                    <p className="kpi-label">Total Generado</p>
                    <p className="kpi-value">${totalGenerado.toFixed(2)}</p>
                </div>
                <div className="kpi-item">
                    <p className="kpi-label">Total Registros</p>
                    <p className="kpi-value">{totalRecords}</p>
                </div>
            </div>

            <table className="report-table">
                <thead>
                    <tr>
                        <th>Período (Mes/Año)</th>
                        <th className="table-center">Total Multas</th>
                        <th className="table-right">Pagado</th>
                        <th className="table-right">Pendiente</th>
                        <th className="table-right">Total Generado</th>
                        <th className="table-center">% Cobrado</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const porcentajeCobrado = Number(row.monto_total_generado) > 0 
                            ? (Number(row.total_pagado) / Number(row.monto_total_generado) * 100).toFixed(1)
                            : '0.0';
                        
                        return (
                            <tr key={row.mes_periodo}>
                                <td>{row.mes_periodo}</td>
                                <td className="table-center">{row.total_multas}</td>
                                <td className="table-right">${Number(row.total_pagado).toFixed(2)}</td>
                                <td className="table-right" style={{ color: Number(row.total_pendiente) > 0 ? '#d32f2f' : undefined }}>
                                    ${Number(row.total_pendiente).toFixed(2)}
                                </td>
                                <td className="table-right">${Number(row.monto_total_generado).toFixed(2)}</td>
                                <td className="table-center">{porcentajeCobrado}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
              {params.page > 1 && (
                <a href={`?pendientes_solo=${params.pendientes_solo}&limit=${params.limit}&page=${params.page - 1}`} 
                   style={{ padding: '8px 12px', background: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                  ← Anterior
                </a>
              )}
              <span>Página {params.page} de {totalPages}</span>
              {params.page < totalPages && (
                <a href={`?pendientes_solo=${params.pendientes_solo}&limit=${params.limit}&page=${params.page + 1}`}
                   style={{ padding: '8px 12px', background: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                  Siguiente →
                </a>
              )}
            </div>
        </main>
    );
}
