CREATE TABLE members(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    member_type VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE books(
    id SERIAL PRIMARY KEY, 
    title VARCHAR (100) NOT NULL,
    author VARCHAR (100) NOT NULL,
    category VARCHAR (50) NOT NULL,
    isbn varchar (50) UNIQUE NOT NULL 
);

CREATE TABLE copies(
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id),
    barcode VARCHAR (50) UNIQUE NOT NULL,
    status VARCHAR (20) NOT NULL
);

CREATE TABLE loans(
    id SERIAL PRIMARY KEY, 
    copy_id INTEGER NOT NULL REFERENCES copies(id),
    member_id INTEGER NOT NULL REFERENCES members(id),
    loaned_at TIMESTAMP NOT NULL,
    due_at TIMESTAMP NOT NULL,
    returned_at TIMESTAMP
);

CREATE TABLE fines(
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    amount NUMERIC(10,2) NOT NULL,
    paid_at TIMESTAMP
);



