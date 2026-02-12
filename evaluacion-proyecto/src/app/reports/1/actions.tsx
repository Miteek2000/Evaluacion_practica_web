"use server";

import { pool } from '../../../lib/db';
import { Report1Input } from './squema';

type BookRow = {
  book_id: number;
  titulo_libro: string;
  autor_libro: string;
  categoria: string;
  total_prestamos: number;
  posicion_ranking: number;
};

type Report1Result = {
  ok: boolean;
  data?: {
    rows: BookRow[];
    totalRecords: number;
    totalPages: number;
    totalLoans: number;
    topBook: BookRow | null;
  };
  error?: string;
};

export async function getLibrosMasPrestados(params: Report1Input): Promise<Report1Result> {
  try {
    const offset = (params.page - 1) * params.limit;

    const whereClause = params.categoria ? 'WHERE categoria = $1' : '';
    const queryParams = params.categoria ? [params.categoria, params.limit, offset] : [params.limit, offset];
    const paramStart = params.categoria ? 2 : 1;

    const result = await pool.query(
      `SELECT book_id, titulo_libro, autor_libro, categoria, total_prestamos, posicion_ranking
       FROM vw_most_borrowed_books
       ${whereClause}
       ORDER BY total_prestamos DESC
       LIMIT $${paramStart} OFFSET $${paramStart + 1}`,
      queryParams
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM vw_most_borrowed_books ${whereClause}`,
      params.categoria ? [params.categoria] : []
    );

    const rows = result.rows as BookRow[];
    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / params.limit);
    const totalLoans = rows.reduce((acc, r) => acc + Number(r.total_prestamos), 0);
    const topBook = rows[0] ?? null;

    return {
      ok: true,
      data: {
        rows,
        totalRecords,
        totalPages,
        totalLoans,
        topBook,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
