"use server";

import { pool } from '../../../lib/db';
import { Report3Input } from './squema';

type FinesSummaryRow = {
  mes_periodo: string;
  total_multas: number;
  total_pagado: number;
  total_pendiente: number;
  monto_total_generado: number;
};

type Report3Result = {
  ok: boolean;
  data?: {
    rows: FinesSummaryRow[];
    totalRecords: number;
    totalPages: number;
    totalPagado: number;
    totalPendiente: number;
    totalGenerado: number;
  };
  error?: string;
};

export async function getResumenMultas(params: Report3Input): Promise<Report3Result> {
  try {
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

    return {
      ok: true,
      data: {
        rows,
        totalRecords,
        totalPages,
        totalPagado,
        totalPendiente,
        totalGenerado,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
