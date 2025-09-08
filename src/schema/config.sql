CREATE TABLE config_integer (
  name TEXT NOT NULL,
  value INTEGER,
  PRIMARY KEY(name),
  CHECK (
    (name = 'now_epoch_millis' AND value >= 0)
  )
) STRICT;

CREATE VIEW config_now_view AS
SELECT COALESCE(
    (SELECT value FROM config_integer WHERE name = 'now_epoch_millis'),
    strftime('%s', 'now') * 1000
) AS epoch_millis;
