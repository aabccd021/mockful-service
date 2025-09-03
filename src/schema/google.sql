CREATE TABLE google_project (
  id TEXT PRIMARY KEY
) STRICT;

CREATE TABLE google_auth_session (
  code TEXT PRIMARY KEY, 
  scope TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT,
  user_sub TEXT NOT NULL,
  client_id TEXT NOT NULL,
  CHECK (code_challenge_method IN ('S256', 'plain')),
  FOREIGN KEY (user_sub) REFERENCES google_auth_user(sub) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES google_auth_client(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE google_auth_user (
  sub TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified TEXT,
  project_id TEXT NOT NULL, 
  CHECK (email_verified IN ('true', 'false')),
  FOREIGN KEY (project_id) REFERENCES google_project(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE google_auth_client (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  project_id TEXT NOT NULL
) STRICT;

CREATE TABLE google_auth_redirect_uri (
  value TEXT NOT NULL,
  client_id TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES google_auth_client(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;


