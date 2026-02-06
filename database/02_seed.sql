INSERT INTO members (name, email, member_type, joined_at) VALUES
('Ana López', 'ana.lopez@mail.com', 'student', '2025-01-10'),
('Carlos Ruiz', 'carlos.ruiz@mail.com', 'student', '2025-02-05'),
('María Gómez', 'maria.gomez@mail.com', 'teacher', '2024-11-20'),
('Luis Fernández', 'luis.fernandez@mail.com', 'external', '2025-03-01'),
('Sofía Torres', 'sofia.torres@mail.com', 'student', '2025-01-25'),
('Jorge Castillo', 'jorge.castillo@mail.com', 'teacher', '2024-09-15'),
('Paola Medina', 'paola.medina@mail.com', 'student', '2025-02-18'),
('Ricardo Núñez', 'ricardo.nunez@mail.com', 'external', '2024-12-02');

INSERT INTO books (title, author, category, isbn) VALUES
('Cien años de soledad', 'Gabriel García Márquez', 'Novela', '978-0307474728'),
('1984', 'George Orwell', 'Distopía', '978-0451524935'),
('El principito', 'Antoine de Saint-Exupéry', 'Fábula', '978-0156012195'),
('Clean Code', 'Robert C. Martin', 'Tecnología', '978-0132350884'),
('Don Quijote de la Mancha', 'Miguel de Cervantes', 'Clásico', '978-0060934347'),
('Sapiens', 'Yuval Noah Harari', 'Historia', '978-0062316097'),
('Harry Potter y la piedra filosofal', 'J.K. Rowling', 'Fantasía', '978-0590353427');

INSERT INTO copies (book_id, barcode, status) VALUES
(1, 'BC-1001', 'available'),
(1, 'BC-1002', 'loaned'),
(2, 'BC-2001', 'loaned'),
(2, 'BC-2002', 'available'),
(3, 'BC-3001', 'available'),
(4, 'BC-4001', 'loaned'),
(4, 'BC-4002', 'available'),
(5, 'BC-5001', 'loaned'),
(6, 'BC-6001', 'available'),
(7, 'BC-7001', 'loaned');

INSERT INTO loans (copy_id, member_id, loaned_at, due_at, returned_at) VALUES
(2, 1, '2025-03-01', '2025-03-10', '2025-03-09'),
(3, 2, '2025-03-02', '2025-03-12', NULL),
(6, 3, '2025-02-15', '2025-02-25', '2025-03-01'),
(8, 4, '2025-02-20', '2025-03-01', NULL),
(10, 5, '2025-03-03', '2025-03-13', NULL),
(1, 6, '2025-01-10', '2025-01-20', '2025-01-18'),
(5, 7, '2025-02-01', '2025-02-10', '2025-02-09'),
(7, 8, '2025-01-25', '2025-02-05', '2025-02-20');

INSERT INTO fines (loan_id, amount, paid_at) VALUES
(3, 50.00, '2025-03-02'),
(4, 75.00, NULL),
(8, 120.00, '2025-02-25'),
(2, 40.00, NULL);
