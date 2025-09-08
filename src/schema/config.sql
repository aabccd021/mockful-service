CREATE TABLE config (
  name TEXT NOT NULL,
  value TEXT,
  PRIMARY KEY(name),
  CHECK (
    (name = 'now' AND value GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
  )
) STRICT;
