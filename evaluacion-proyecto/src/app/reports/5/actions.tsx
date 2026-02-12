"use server";

import { pool } from '../../../lib/db';
import { Report5Input } from './squema';

type InventoryHealthRow = {
  category: string;
  total_ejemplares: number;
  disponibles: number;
  prestados: number;
  perdidos: number;
  porcentaje_disponibilidad: number;
  estado_salud: string;
};

type Report5Result = {
  ok: boolean;
  data?: {
    rows: InventoryHealthRow[];
    totalRecords: number;
    totalPages: number;
    totalCopies: number;
    totalAvailable: number;
    totalLost: number;
    avgAvailability: number;
    criticalCategories: number;
  };
  error?: string;
};

export async function getSaludInventario(params: Report5Input): Promise<Report5Result> {
  try {
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

    return {
      ok: true,
      data: {
        rows,
        totalRecords,
        totalPages,
        totalCopies,
        totalAvailable,
        totalLost,
        avgAvailability,
        criticalCategories,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
