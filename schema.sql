CREATE TABLE google_project (
  id TEXT,
  CONSTRAINT google_project_pk PRIMARY KEY (id)
) STRICT;

CREATE TABLE google_auth_session (
  code TEXT,
  user TEXT,
  client_id TEXT,
  redirect_uri TEXT,
  scope TEXT,
  code_challenge TEXT,
  code_challenge_method TEXT,
  CONSTRAINT google_auth_session_code_pk PRIMARY KEY (code),
  CONSTRAINT google_auth_session_user_not_null CHECK (user IS NOT NULL),
  CONSTRAINT google_auth_session_client_id_not_null CHECK (client_id IS NOT NULL),
  CONSTRAINT google_auth_session_redirect_uri_not_null CHECK (redirect_uri IS NOT NULL),
  CONSTRAINT google_auth_session_challenge_method_enum CHECK (code_challenge_method IN ('S256', 'plain'))
) STRICT;

CREATE TABLE google_auth_user (
  sub TEXT,
  email TEXT,
  email_verified TEXT,
  project_id TEXT NOT NULL,
  CONSTRAINT google_auth_user_sub_pk PRIMARY KEY (sub),
  CONSTRAINT google_auth_user_email_not_null CHECK (email IS NOT NULL),
  CONSTRAINT google_auth_user_email_unique UNIQUE (email),
  CONSTRAINT google_auth_user_email_verified_boolean CHECK (email_verified IN ('true', 'false')),
  CONSTRAINT google_auth_user_project_id_not_null CHECK (project_id IS NOT NULL),
  CONSTRAINT google_auth_user_project_id_fk FOREIGN KEY (project_id) REFERENCES google_project(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE google_auth_client (
  id TEXT,
  secret TEXT,
  project_id TEXT,
  CONSTRAINT google_auth_client_id_pk PRIMARY KEY (id),
  CONSTRAINT google_auth_client_secret_not_null CHECK (secret IS NOT NULL)
) STRICT;

CREATE TABLE paddle_project (
  id TEXT,
  CONSTRAINT paddle_project_pk PRIMARY KEY (id)
) STRICT;

-- https://developer.paddle.com/api-reference/about/paddle-ids#common-examples

CREATE TABLE paddle_api_key (
  project_id TEXT,
  key TEXT,
  CONSTRAINT paddle_api_key_pk PRIMARY KEY (key),
  CONSTRAINT paddle_api_key_id_prefix CHECK (key LIKE 'pdl_live_apikey_%' OR key LIKE 'pdl_sdbx_apikey_%'), -- https://developer.paddle.com/api-reference/about/api-keys#format
  CONSTRAINT paddle_api_key_id_length CHECK (LENGTH(key) = 69),
  CONSTRAINT paddle_api_key_project_id_not_null CHECK (project_id IS NOT NULL),
  CONSTRAINT paddle_api_key_project_id_fk FOREIGN KEY (project_id) REFERENCES paddle_project(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_customer (
  project_id TEXT NOT NULL,
  id TEXT,
  email TEXT NOT NULL,
  CONSTRAINT paddle_customer_email_unique UNIQUE (project_id, email),
  CONSTRAINT paddle_customer_price_pk PRIMARY KEY (id),
  CONSTRAINT paddle_customer_id_prefix CHECK (id LIKE 'ctm_%'),
  CONSTRAINT paddle_customer_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_customer_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_customer_project_id_fk FOREIGN KEY (project_id) REFERENCES paddle_project(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_product (
  project_id TEXT NOT NULL,
  id TEXT,
  CONSTRAINT paddle_product_pk PRIMARY KEY (id),
  CONSTRAINT paddle_product_id_prefix CHECK (id LIKE 'pro_%'),
  CONSTRAINT paddle_product_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_product_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_product_project_id_fk FOREIGN KEY (project_id) REFERENCES paddle_project(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_price (
  project_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  id TEXT,
  CONSTRAINT paddle_price_pk PRIMARY KEY (id),
  CONSTRAINT paddle_price_id_prefix CHECK (id LIKE 'pri_%'),
  CONSTRAINT paddle_price_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_price_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_price_product_id_fk FOREIGN KEY (product_id) REFERENCES paddle_product(id) ON DELETE CASCADE,
  CONSTRAINT paddle_price_project_id_fk FOREIGN KEY (project_id) REFERENCES paddle_project(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction (
  project_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  id TEXT,
  CONSTRAINT paddle_transaction_pk PRIMARY KEY (id),
  CONSTRAINT paddle_transaction_id_prefix CHECK (id LIKE 'txn_%'),
  CONSTRAINT paddle_transaction_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_transaction_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_transaction_customer_id_fk FOREIGN KEY (customer_id) REFERENCES paddle_customer(id) ON DELETE CASCADE,
  CONSTRAINT paddle_transaction_project_id_fk FOREIGN KEY (project_id) REFERENCES paddle_project(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction_item (
  transaction_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  CONSTRAINT paddle_transaction_item_pk PRIMARY KEY (transaction_id, price_id),
  CONSTRAINT paddle_transaction_item_transaction_id_fk FOREIGN KEY (transaction_id) REFERENCES paddle_transaction(id) ON DELETE CASCADE,
  CONSTRAINT paddle_transaction_item_price_id_fk FOREIGN KEY (price_id) REFERENCES paddle_price(id) ON DELETE CASCADE
) STRICT
