
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app') THEN
        CREATE ROLE app WITH LOGIN PASSWORD 'app_password_secure_2024';
    END IF;
END
$$;


GRANT CONNECT ON DATABASE library_db TO app;


GRANT USAGE ON SCHEMA public TO app;


REVOKE ALL PRIVILEGES ON books, members, copies, loans, fines FROM app;


REVOKE CREATE ON SCHEMA public FROM app;


GRANT SELECT ON vw_most_borrowed_books TO app;
GRANT SELECT ON vw_overdue_loans TO app;
GRANT SELECT ON vw_fines_summary TO app;
GRANT SELECT ON vw_member_activity TO app;
GRANT SELECT ON vw_inventory_health TO app;


ALTER ROLE app SET search_path TO public;
