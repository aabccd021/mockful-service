CREATE TABLE google_project (
  id TEXT,
  CONSTRAINT google_project_pk PRIMARY KEY (id)
) STRICT;

CREATE TABLE google_auth_session (
  code TEXT,
  user TEXT,
  client_id TEXT,
  scope TEXT,
  code_challenge TEXT,
  code_challenge_method TEXT,
  CONSTRAINT google_auth_session_code_pk PRIMARY KEY (code),
  CONSTRAINT google_auth_session_user_not_null CHECK (user IS NOT NULL),
  CONSTRAINT google_auth_session_client_id_not_null CHECK (client_id IS NOT NULL),
  CONSTRAINT google_auth_session_challenge_method_enum CHECK (code_challenge_method IN ('S256', 'plain'))
) STRICT;

CREATE TABLE google_auth_user (
  sub TEXT,
  email TEXT,
  email_verified TEXT,
  project_id TEXT,
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
  redirect_uri TEXT,
  CONSTRAINT google_auth_client_id_pk PRIMARY KEY (id),
  CONSTRAINT google_auth_client_secret_not_null CHECK (secret IS NOT NULL)
  CONSTRAINT google_auth_client_project_id_not_null CHECK (project_id IS NOT NULL)
) STRICT;

CREATE TABLE google_auth_redirect_uri (
  value TEXT,
  client_id TEXT,
  CONSTRAINT google_auth_redirect_uri_value_not_null CHECK (value IS NOT NULL),
  CONSTRAINT google_auth_redirect_uri_client_id_not_null CHECK (client_id IS NOT NULL),
  CONSTRAINT google_auth_redirect_uri_client_id_fk FOREIGN KEY (client_id) REFERENCES google_auth_client(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_account (
  id TEXT,
  tax_mode TEXT DEFAULT 'internal',
  tax_category_saas_enabled TEXT DEFAULT 'false',
  CONSTRAINT paddle_account_pk PRIMARY KEY (id),
  CONSTRAINT paddle_account_tax_mode_enum CHECK (tax_mode IN ('internal', 'external')),
  CONSTRAINT paddle_account_tax_category_saas_enabled_boolean CHECK (tax_category_saas_enabled IN ('true', 'false'))
) STRICT;

-- https://developer.paddle.com/api-reference/about/paddle-ids#common-examples

CREATE TABLE paddle_api_key (
  account_id TEXT,
  key TEXT,
  CONSTRAINT paddle_api_key_pk PRIMARY KEY (key),
  CONSTRAINT paddle_api_key_id_prefix CHECK (key LIKE 'pdl_live_apikey_%' OR key LIKE 'pdl_sdbx_apikey_%'), -- https://developer.paddle.com/api-reference/about/api-keys#format
  CONSTRAINT paddle_api_key_id_length CHECK (LENGTH(key) = 69),
  CONSTRAINT paddle_api_key_account_id_not_null CHECK (account_id IS NOT NULL),
  CONSTRAINT paddle_api_key_account_id_fk FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_customer (
  id TEXT,
  email TEXT,
  status TEXT DEFAULT 'active',
  name TEXT,
  marketing_consent TEXT DEFAULT 'false',
  locale TEXT DEFAULT 'en',
  created_at INTEGER,
  updated_at INTEGER,
  account_id TEXT,
  CONSTRAINT paddle_customer_id_pk PRIMARY KEY (id),
  CONSTRAINT paddle_customer_id_prefix CHECK (id LIKE 'ctm_%'),
  CONSTRAINT paddle_customer_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_customer_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_customer_email_unique UNIQUE (account_id, email),
  CONSTRAINT paddle_customer_email_not_null CHECK (email IS NOT NULL),
  CONSTRAINT paddle_customer_status_enum CHECK (status IN ('active', 'archived')),
  CONSTRAINT paddle_customer_status_not_null CHECK (status IS NOT NULL),
  CONSTRAINT paddle_customer_marketing_consent_boolean CHECK (marketing_consent IN ('true', 'false')),
  CONSTRAINT paddle_customer_marketing_consent_not_null CHECK (marketing_consent IS NOT NULL),
  CONSTRAINT paddle_customer_locale_not_null CHECK (locale IS NOT NULL),
  CONSTRAINT paddle_customer_created_at_not_null CHECK (created_at IS NOT NULL),
  CONSTRAINT paddle_customer_updated_at_not_null CHECK (updated_at IS NOT NULL),
  CONSTRAINT paddle_customer_account_id_not_null CHECK (account_id IS NOT NULL),
  CONSTRAINT paddle_customer_account_id_fk FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_product (
  id TEXT,
  tax_category TEXT,
  account_id TEXT,
  CONSTRAINT paddle_product_pk PRIMARY KEY (id),
  CONSTRAINT paddle_product_id_prefix CHECK (id LIKE 'pro_%'),
  CONSTRAINT paddle_product_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_product_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_product_tax_category_enum CHECK (tax_category IN ('digital-goods', 'ebooks', 'implementation-services', 'professional-services', 'saas', 'software-programming-services', 'standard', 'training-services', 'website-hosting')),
  CONSTRAINT paddle_product_tax_category_not_null CHECK (tax_category IS NOT NULL),
  CONSTRAINT paddle_product_account_id_not_null CHECK (account_id IS NOT NULL),
  CONSTRAINT paddle_product_account_id_fk FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_price (
  product_id TEXT,
  id TEXT,
  CONSTRAINT paddle_price_pk PRIMARY KEY (id),
  CONSTRAINT paddle_price_id_prefix CHECK (id LIKE 'pri_%'),
  CONSTRAINT paddle_price_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_price_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_price_product_id_not_null CHECK (product_id IS NOT NULL),
  CONSTRAINT paddle_price_product_id_fk FOREIGN KEY (product_id) REFERENCES paddle_product(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction (
  customer_id TEXT,
  id TEXT,
  CONSTRAINT paddle_transaction_pk PRIMARY KEY (id),
  CONSTRAINT paddle_transaction_id_prefix CHECK (id LIKE 'txn_%'),
  CONSTRAINT paddle_transaction_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_transaction_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_transaction_customer_id_not_null CHECK (customer_id IS NOT NULL),
  CONSTRAINT paddle_transaction_customer_id_fk FOREIGN KEY (customer_id) REFERENCES paddle_customer(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction_item (
  transaction_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  CONSTRAINT paddle_transaction_item_pk PRIMARY KEY (transaction_id, price_id),
  CONSTRAINT paddle_transaction_item_transaction_id_fk FOREIGN KEY (transaction_id) REFERENCES paddle_transaction(id) ON DELETE CASCADE,
  CONSTRAINT paddle_transaction_item_price_id_fk FOREIGN KEY (price_id) REFERENCES paddle_price(id) ON DELETE CASCADE
) STRICT
