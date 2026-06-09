ALTER TABLE games
ADD COLUMN status_source VARCHAR(30) NULL AFTER status;

UPDATE games
SET status_source = 'manual'
WHERE status = 'inactive'
  AND status_source IS NULL;
