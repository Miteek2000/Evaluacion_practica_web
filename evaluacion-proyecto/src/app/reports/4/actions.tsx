"use server";

import { pool } from '../../../lib/db';
import { Report4Input } from './squema';

type MemberActivityRow = {
  member_id: number;
  socio: string;
  member_type: string;
  total_prestamos: number;
  prestamos_con_atraso: number;
  tasa_atraso_porcentaje: number;
  categoria_actividad: string;
};

type Report4Result = {
  ok: boolean;
  data?: {
    rows: MemberActivityRow[];
    totalRecords: number;
    totalPages: number;
    totalLoans: number;
    avgOverdueRate: number;
    activeMembers: number;
  };
  error?: string;
};

export async function getActividadSocios(params: Report4Input): Promise<Report4Result> {
  try {
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

    return {
      ok: true,
      data: {
        rows,
        totalRecords,
        totalPages,
        totalLoans,
        avgOverdueRate,
        activeMembers,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
