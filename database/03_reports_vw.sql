-- 1. vw_most_borrowed_books
-- Devuelve: Ranking de libros más solicitados.
-- Grain: Un registro por libro.
-- Métricas: total_loans, ranking posicional.
-- Requisito: Window Function + Lista de columnas (sin SELECT *).

CREATE OR REPLACE VIEW vw_most_borrowed_books AS
SELECT
    b.id AS book_id,
    b.title AS titulo_libro,
    b.author AS autor_libro,
    b.category AS categoria,
    COUNT(l.id) AS total_prestamos,
    DENSE_RANK() OVER (ORDER BY COUNT(l.id) DESC) AS posicion_ranking
FROM books b
JOIN copies c ON b.id = c.book_id
JOIN loans l ON c.id = l.copy_id
GROUP BY b.id, b.title, b.author, b.category;

-- VERIFY QUERIES
-- SELECT * FROM vw_most_borrowed_books WHERE posicion_ranking <= 5;
-- SELECT * FROM vw_most_borrowed_books WHERE titulo_libro ILIKE '%quijote%';


-- 2. vw_overdue_loans
-- Devuelve: Préstamos vencidos o devueltos tarde.
-- Grain: Un registro por préstamo.
-- Métricas: días de atraso, monto sugerido.
-- Requisito: CTE (WITH) + CASE significativo + Lista de columnas.
CREATE OR REPLACE VIEW vw_overdue_loans AS
WITH overdue_calc AS (
    SELECT 
        l.id AS loan_id,
        m.name AS member_name,
        b.title AS book_title,
        l.due_at,
        l.returned_at, 
        (COALESCE(l.returned_at::date, CURRENT_DATE) - l.due_at::date) AS dias_atraso
    FROM loans l 
    JOIN members m ON l.member_id = m.id
    JOIN copies c ON l.copy_id = c.id
    JOIN books b ON c.book_id = b.id
    WHERE (l.returned_at IS NULL AND l.due_at < NOW())
       OR (l.returned_at > l.due_at)
)
SELECT 
    loan_id,
    member_name,
    book_title,
    due_at,
    returned_at,
    dias_atraso,
    (dias_atraso * 2.50) AS monto_sugerido,
    CASE 
        WHEN dias_atraso <= 7 THEN 'Retraso Leve'
        WHEN dias_atraso <= 30 THEN 'Retraso Serio'
        ELSE 'Crítico / Perdido'
    END AS severidad
FROM overdue_calc
WHERE dias_atraso > 0;

-- VERIFY QUERIES
-- SELECT * FROM vw_overdue_loans WHERE dias_atraso > 15;
-- SELECT SUM(monto_sugerido) FROM vw_overdue_loans;


-- 3. vw_fines_summary
-- Devuelve: Resumen financiero agrupado por mes/año.
-- Grain: Un registro por mes/año.
-- Métricas: total pagado, total pendiente.
-- Requisito: HAVING + CASE/COALESCE.
CREATE OR REPLACE VIEW vw_fines_summary AS
SELECT 
    TO_CHAR(l.loaned_at, 'YYYY-MM') AS mes_periodo,
    COUNT(f.id) AS total_multas,
    SUM(CASE WHEN f.paid_at IS NOT NULL THEN f.amount ELSE 0 END) AS total_pagado,
    SUM(CASE WHEN f.paid_at IS NULL THEN f.amount ELSE 0 END) AS total_pendiente,
    SUM(f.amount) AS monto_total_generado
FROM fines f
JOIN loans l ON f.loan_id = l.id
GROUP BY mes_periodo
HAVING COUNT(f.id) > 0;

-- VERIFY QUERIES
-- SELECT * FROM vw_fines_summary WHERE total_pendiente > 0;
-- SELECT * FROM vw_fines_summary ORDER BY mes_periodo DESC;


-- 4. vw_member_activity
-- Devuelve: Indicadores de fidelidad y puntualidad de socios.
-- Grain: Un registro por socio.
-- Métricas: tasa_atraso_porcentaje.
-- Requisito: HAVING + CASE + COALESCE significativo.
CREATE OR REPLACE VIEW vw_member_activity AS
SELECT 
    m.id AS member_id,
    m.name AS socio,
    m.member_type,
    COUNT(l.id) AS total_prestamos,
    SUM(CASE WHEN l.returned_at > l.due_at OR (l.returned_at IS NULL AND l.due_at < NOW()) THEN 1 ELSE 0 END) AS prestamos_con_atraso,
    ROUND((SUM(CASE WHEN l.returned_at > l.due_at OR (l.returned_at IS NULL AND l.due_at < NOW()) THEN 1 ELSE 0 END)::NUMERIC / 
           NULLIF(COUNT(l.id), 0)) * 100, 2) AS tasa_atraso_porcentaje,
    CASE 
        WHEN COUNT(l.id) >= 10 THEN 'Socio Frecuente'
        WHEN COUNT(l.id) BETWEEN 1 AND 9 THEN 'Socio Ocasional'
        ELSE 'Inactivo'
    END AS categoria_actividad
FROM members m
LEFT JOIN loans l ON m.id = l.member_id
GROUP BY m.id, m.name, m.member_type
HAVING COUNT(l.id) > 0;

-- VERIFY QUERIES
-- SELECT * FROM vw_member_activity WHERE tasa_atraso_porcentaje > 50;
-- SELECT socio, categoria_actividad FROM vw_member_activity;


-- 5. vw_inventory_health
-- Devuelve: Estado operativo de las copias por categoría.
-- Grain: Un registro por categoría de libro.
-- Métricas: porcentaje de disponibilidad.
-- Requisito: CASE + COALESCE + Agregados.
CREATE OR REPLACE VIEW vw_inventory_health AS
SELECT 
    b.category,
    COUNT(c.id) AS total_ejemplares,
    COALESCE(SUM(CASE WHEN c.status = 'disponible' THEN 1 ELSE 0 END), 0) AS disponibles,
    COALESCE(SUM(CASE WHEN c.status = 'prestado' THEN 1 ELSE 0 END), 0) AS prestados,
    COALESCE(SUM(CASE WHEN c.status = 'perdido' THEN 1 ELSE 0 END), 0) AS perdidos,
    ROUND((COALESCE(SUM(CASE WHEN c.status = 'disponible' THEN 1 ELSE 0 END), 0)::NUMERIC / 
           NULLIF(COUNT(c.id), 0)) * 100, 2) AS porcentaje_disponibilidad,
    CASE 
        WHEN SUM(CASE WHEN c.status = 'perdido' THEN 1 ELSE 0 END) > (COUNT(c.id) * 0.1) THEN 'Crítico: Muchas Pérdidas'
        WHEN SUM(CASE WHEN c.status = 'disponible' THEN 1 ELSE 0 END) < (COUNT(c.id) * 0.2) THEN 'Alerta: Stock Bajo'
        ELSE 'Saludable'
    END AS estado_salud
FROM books b
LEFT JOIN copies c ON b.id = c.book_id
GROUP BY b.category;

-- VERIFY QUERIES
-- SELECT * FROM vw_inventory_health WHERE estado_salud != 'Saludable';
-- SELECT category, porcentaje_disponibilidad FROM vw_inventory_health;