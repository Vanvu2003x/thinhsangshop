ALTER TABLE games
ADD COLUMN sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order for games (smaller first)';

SET @rownum := 0;
UPDATE games g
JOIN (
    SELECT id, (@rownum := @rownum + 1) AS new_sort_order
    FROM games
    ORDER BY name ASC, id ASC
) s ON s.id = g.id
SET g.sort_order = s.new_sort_order
WHERE g.sort_order = 0;

CREATE INDEX idx_games_sort_order ON games(sort_order);
