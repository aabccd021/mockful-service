CREATE TABLE google_auth_session (
  code TEXT,
  user TEXT NOT NULL,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  code_challenge TEXT,
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain')),
  CONSTRAINT google_auth_session_pkey PRIMARY KEY (code)
) STRICT;

CREATE TABLE google_auth_user (
  sub TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TEXT,
  CONSTRAINT google_auth_user_pkey PRIMARY KEY (sub),
  CONSTRAINT google_auth_user_email_verified_boolean CHECK (email_verified IN ('true', 'false'))
) STRICT;

CREATE TABLE google_auth_client (
  id TEXT,
  secret TEXT NOT NULL,
  CONSTRAINT google_auth_client_pkey PRIMARY KEY (id)
) STRICT;

CREATE TABLE paddle_tenant (
  id TEXT,
  CONSTRAINT paddle_tenant_pkey PRIMARY KEY (id)
) STRICT;

-- https://developer.paddle.com/api-reference/about/paddle-ids#common-examples

CREATE TABLE paddle_api_key (
  tenant_id TEXT NOT NULL,
  key TEXT,
  CONSTRAINT paddle_api_pkey PRIMARY KEY (key),
  CONSTRAINT paddle_api_key_id_prefix CHECK (key LIKE 'pdl_live_apikey_%'), -- https://developer.paddle.com/api-reference/about/api-keys#format
  CONSTRAINT paddle_api_key_id_length CHECK (LENGTH(key) = 69),
  CONSTRAINT paddle_api_key_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_customer (
  tenant_id TEXT NOT NULL,
  id TEXT,
  email TEXT NOT NULL,
  CONSTRAINT paddle_customer_email_unique UNIQUE (tenant_id, email),
  CONSTRAINT paddle_customer_price_pkey PRIMARY KEY (id),
  CONSTRAINT paddle_customer_id_prefix CHECK (id LIKE 'ctm_%'),
  CONSTRAINT paddle_customer_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_customer_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_customer_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_product (
  tenant_id TEXT NOT NULL,
  id TEXT,
  CONSTRAINT paddle_product_pkey PRIMARY KEY (id),
  CONSTRAINT paddle_product_id_prefix CHECK (id LIKE 'pro_%'),
  CONSTRAINT paddle_product_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_product_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_product_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_price (
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  id TEXT,
  CONSTRAINT paddle_price_pkey PRIMARY KEY (id),
  CONSTRAINT paddle_price_id_prefix CHECK (id LIKE 'pri_%'),
  CONSTRAINT paddle_price_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_price_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_price_product_id_fkey FOREIGN KEY (product_id) REFERENCES paddle_product(id) ON DELETE CASCADE,
  CONSTRAINT paddle_price_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction (
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  id TEXT,
  CONSTRAINT paddle_transaction_pkey PRIMARY KEY (id),
  CONSTRAINT paddle_transaction_id_prefix CHECK (id LIKE 'txn_%'),
  CONSTRAINT paddle_transaction_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_transaction_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_transaction_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES paddle_customer(id) ON DELETE CASCADE,
  CONSTRAINT paddle_transaction_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES paddle_tenant(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction_item (
  transaction_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  CONSTRAINT paddle_transaction_item_pkey PRIMARY KEY (transaction_id, price_id),
  CONSTRAINT paddle_transaction_item_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES paddle_transaction(id) ON DELETE CASCADE,
  CONSTRAINT paddle_transaction_item_price_id_fkey FOREIGN KEY (price_id) REFERENCES paddle_price(id) ON DELETE CASCADE
) STRICT
