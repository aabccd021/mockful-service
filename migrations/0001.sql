CREATE TABLE login_session (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  state TEXT,
  scope TEXT NOT NULL,
  code_challenge_value TEXT,
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain'))
);

CREATE TABLE auth_session (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  sub TEXT,
  code_challenge_value TEXT,
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain'))
);
