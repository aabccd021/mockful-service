CREATE TABLE google_auth_session (
  code TEXT PRIMARY KEY,
  user TEXT NOT NULL,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  code_challenge TEXT,
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain'))
) STRICT;

CREATE TABLE google_auth_user (
  sub TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified TEXT,
  CONSTRAINT google_auth_user_email_verified_boolean CHECK (email_verified IN ('true', 'false'))
) STRICT;

CREATE TABLE google_auth_client (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL
) STRICT;
