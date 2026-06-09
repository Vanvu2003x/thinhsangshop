ALTER TABLE games
ADD COLUMN status varchar(20) DEFAULT 'active';

UPDATE games
SET status = 'active'
WHERE status IS NULL;
