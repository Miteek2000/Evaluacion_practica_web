import { getResumenMultas } from "./actions";
import { Report3Schema } from "./squema";

export const dynamic = 'force-dynamic';

interface Reporte3PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Reporte3({ searchParams }: Reporte3PageProps) {
    const resolvedParams = await searchParams;
    
    const parsed = Report3Schema.safeParse(resolvedParams);

    if (!parsed.success) {
      return <div>Error en parámetros</div>;
    }

    const { ok, data, error } = await getResumenMultas(parsed.data);

    if (!ok || !data) return <div>Error: {error}</div>;

    const { rows, totalRecords, totalPages, totalPagado, totalPendiente, totalGenerado } = data;
    const params = parsed.data;

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
