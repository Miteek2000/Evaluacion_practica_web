"use server";

import { pool } from '../../../lib/db';
import { Report2Input } from './squema';

type OverdueRow = {
  loan_id: number;
  member_name: string;
  book_title: string;
  due_at: string;
  returned_at: string | null;
  dias_atraso: number;
};

type Report2Result = {
  ok: boolean;
  data?: {
    rows: OverdueRow[];
    totalRecords: number;
    totalPages: number;
    totalOverdue: number;
    avgDaysOverdue: number;
  };
  error?: string;
};

export async function getPrestamosVencidos(params: Report2Input): Promise<Report2Result> {
  try {
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

    return {
      ok: true,
      data: {
        rows,
        totalRecords,
        totalPages,
        totalOverdue,
        avgDaysOverdue,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
