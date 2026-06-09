ALTER TABLE topup_packages
ADD COLUMN status_source VARCHAR(30) NULL AFTER status,
ADD COLUMN sort_order INT DEFAULT 0 AFTER status_source;

UPDATE topup_packages
SET status_source = CASE
    WHEN status = 'inactive' THEN 'manual'
    ELSE NULL
END
WHERE status_source IS NULL;
