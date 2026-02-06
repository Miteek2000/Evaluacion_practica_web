CREATE INDEX idx_loans_member_id ON loans(member_id);

CREATE INDEX idx_loans_copy_id ON loans(copy_id);

CREATE INDEX idx_loans_due_at_active ON loans(due_at)
WHERE returned_at IS NULL;