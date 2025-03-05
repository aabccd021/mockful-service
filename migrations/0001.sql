CREATE TABLE login_session_code_challenge (
  login_session_code TEXT PRIMARY KEY,
  value TEXT PRIMARY KEY,
  method TEXT CHECK (method IN ('S256', 'plain')) NOT NULL,
  CONSTRAINT fk_code_challenge_login_session_code FOREIGN KEY (login_session_code) REFERENCES login_session (id) ON UPDATE CASCADE ON DELETE CASCADE,
);

CREATE TABLE login_session (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  state TEXT,
  scope TEXT,
);


CREATE TABLE auth_session_code_challenge (
  auth_session_code TEXT PRIMARY KEY,
  value TEXT PRIMARY KEY,
  method TEXT CHECK (method IN ('S256', 'plain')) NOT NULL,
  CONSTRAINT fk_code_challenge_login_session_code FOREIGN KEY (auth_session_code) REFERENCES auth_session (code) ON UPDATE CASCADE ON DELETE CASCADE,
);

CREATE TABLE auth_session (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  sub TEXT,
);
