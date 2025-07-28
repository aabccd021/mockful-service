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

CREATE TABLE paddle_tenant (
  id TEXT PRIMARY KEY
);

-- https://developer.paddle.com/api-reference/about/paddle-ids#common-examples

CREATE TABLE paddle_api_key (
  tenant_id TEXT NOT NULL,
  key TEXT PRIMARY KEY,
  -- https://developer.paddle.com/api-reference/about/api-keys#format
  CONSTRAINT paddle_api_key_id_prefix CHECK (key LIKE 'pdl_live_apikey_%'),
  CONSTRAINT paddle_api_key_id_length CHECK (LENGTH(key) = 69),
  CONSTRAINT paddle_api_key_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
);

CREATE TABLE paddle_customer (
  tenant_id TEXT NOT NULL,
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  CONSTRAINT paddle_customer_id_prefix CHECK (id LIKE 'ctm_%'),
  CONSTRAINT paddle_customer_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_customer_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_customer_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
);

-- CREATE TABLE paddle_product (
--   tenant_id TEXT NOT NULL,
--   id TEXT PRIMARY KEY,
--   name TEXT NOT NULL,
--   description TEXT,
--   CONSTRAINT paddle_product_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
-- );
