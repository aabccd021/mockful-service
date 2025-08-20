CREATE TABLE google_project (
  id TEXT NOT NULL,
  CONSTRAINT google_project_pk PRIMARY KEY (id)
) STRICT;

CREATE TABLE google_auth_session (
  code TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT,
  user_sub TEXT NOT NULL,
  client_id TEXT NOT NULL,
  CONSTRAINT google_auth_session_code_pk PRIMARY KEY (code),
  CONSTRAINT google_auth_session_challenge_method_enum CHECK (code_challenge_method IN ('S256', 'plain')),
  FOREIGN KEY (user_sub) REFERENCES google_auth_user(sub) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES google_auth_client(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE google_auth_user (
  sub TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified TEXT,
  project_id TEXT NOT NULL,
  CONSTRAINT google_auth_user_sub_pk PRIMARY KEY (sub),
  CONSTRAINT google_auth_user_email_verified_boolean CHECK (email_verified IN ('true', 'false')),
  FOREIGN KEY (project_id) REFERENCES google_project(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE google_auth_client (
  id TEXT NOT NULL,
  secret TEXT NOT NULL,
  project_id TEXT NOT NULL,
  CONSTRAINT google_auth_client_id_pk PRIMARY KEY (id)
) STRICT;

CREATE TABLE google_auth_redirect_uri (
  value TEXT NOT NULL,
  client_id TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES google_auth_client(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_account (
  id TEXT NOT NULL,
  tax_mode TEXT NOT NULL DEFAULT 'internal',
  CONSTRAINT paddle_account_pk PRIMARY KEY (id),
  CONSTRAINT paddle_account_tax_mode_enum CHECK (tax_mode IN ('internal', 'external'))
) STRICT;

CREATE TABLE paddle_account_tax_category_enabled (
  tax_category TEXT NOT NULL,
  account_id TEXT NOT NULL,
  CONSTRAINT paddle_account_tax_category_enabled_pk PRIMARY KEY (tax_category, account_id),
  CONSTRAINT paddle_account_tax_category_enabled_tax_category_enum CHECK (tax_category IN ('digital-goods', 'ebooks', 'implementation-services', 'professional-services', 'saas', 'software-programming-services', 'standard', 'training-services', 'website-hosting'))
) STRICT;

CREATE TABLE paddle_api_key (
  account_id TEXT NOT NULL,
  key TEXT NOT NULL,
  CONSTRAINT paddle_api_key_pk PRIMARY KEY (key),
  CONSTRAINT paddle_api_key_id_prefix CHECK (key LIKE 'pdl_live_apikey_%' OR key LIKE 'pdl_sdbx_apikey_%'), -- https://developer.paddle.com/api-reference/about/api-keys#format
  CONSTRAINT paddle_api_key_id_length CHECK (LENGTH(key) = 69),
  FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_customer (
  id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  marketing_consent TEXT NOT NULL DEFAULT 'false',
  locale TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  UNIQUE (account_id, email),
  CONSTRAINT paddle_customer_id_pk PRIMARY KEY (id),
  CONSTRAINT paddle_customer_id_prefix CHECK (id LIKE 'ctm_%'),
  CONSTRAINT paddle_customer_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_customer_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_customer_status_enum CHECK (status IN ('active', 'archived')),
  CONSTRAINT paddle_customer_marketing_consent_boolean CHECK (marketing_consent IN ('true', 'false')),
  FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_product (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  tax_category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active',
  image_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  CONSTRAINT paddle_product_pk PRIMARY KEY (id),
  CONSTRAINT paddle_product_id_prefix CHECK (id LIKE 'pro_%'),
  CONSTRAINT paddle_product_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_product_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_product_tax_category_enum CHECK (tax_category IN ('digital-goods', 'ebooks', 'implementation-services', 'professional-services', 'saas', 'software-programming-services', 'standard', 'training-services', 'website-hosting')),
  CONSTRAINT paddle_product_type_enum CHECK (type IN ('standard', 'custom')),
  CONSTRAINT paddle_product_status_enum CHECK (status IN ('active', 'archived')),
  FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_price (
  description TEXT NOT NULL,
  product_id TEXT NOT NULL,
  unit_price_amount INTEGER NOT NULL,
  unit_price_currency_code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard',
  name TEXT,  
  billing_cycle_frequency INTEGER,
  billing_cycle_interval TEXT,
  tax_mode TEXT NOT NULL DEFAULT 'account_setting',
  quantity_minimum INTEGER NOT NULL DEFAULT 1,
  quantity_maximum INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  id TEXT NOT NULL,
  CONSTRAINT paddle_price_pk PRIMARY KEY (id),
  CONSTRAINT paddle_price_id_prefix CHECK (id LIKE 'pri_%'),
  CONSTRAINT paddle_price_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_price_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_price_unit_price_amount_not_negative CHECK (unit_price_amount >= 0),
  CONSTRAINT paddle_price_unit_price_currency_code_enum CHECK (unit_price_currency_code IN ( 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'SEK', 'ARS', 'BRL', 'CNY', 'COP', 'CZK', 'DKK', 'HUF', 'ILS', 'INR', 'KRW', 'MXN', 'NOK', 'NZD', 'PLN', 'RUB', 'THB', 'TRY', 'TWD', 'UAH', 'VND', 'ZAR')),
  CONSTRAINT paddle_price_type_enum CHECK (type IN ('standard', 'custom')),
  CONSTRAINT paddle_price_billing_cycle_object CHECK ( (billing_cycle_frequency IS NOT NULL AND billing_cycle_interval IS NOT NULL) OR (billing_cycle_frequency IS NULL AND billing_cycle_interval IS NULL)),
  CONSTRAINT paddle_price_billing_cycle_frequency_positive CHECK ( billing_cycle_frequency IS NULL OR billing_cycle_frequency > 0),
  CONSTRAINT paddle_price_billing_cycle_interval_enum CHECK (billing_cycle_interval IN ('day', 'week', 'month', 'year')),
  CONSTRAINT paddle_price_tax_mode_enum CHECK (tax_mode IN ('account_setting', 'external', 'internal')),
  CONSTRAINT paddle_price_quantity_minimum_positive CHECK (quantity_minimum >= 1),
  CONSTRAINT paddle_price_quantity_valid CHECK (quantity_maximum >= quantity_minimum),
  CONSTRAINT paddle_price_status_enum CHECK (status IN ('active', 'archived')),
  FOREIGN KEY (product_id) REFERENCES paddle_product(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction (
  id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  customer_id TEXT,
  collection_mode TEXT NOT NULL DEFAULT 'automatic',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT paddle_transaction_pk PRIMARY KEY (id),
  CONSTRAINT paddle_transaction_id_prefix CHECK (id LIKE 'txn_%'),
  CONSTRAINT paddle_transaction_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_transaction_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_transaction_status_enum CHECK (status IN ('draft', 'ready', 'billed', 'paid', 'completed', 'canceled', 'past_due')),
  CONSTRAINT paddle_transaction_collection_mode_enum CHECK (collection_mode IN ('automatic', 'manual')),
  FOREIGN KEY (customer_id) REFERENCES paddle_customer(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction_item (
  transaction_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  CONSTRAINT paddle_transaction_item_pk PRIMARY KEY (transaction_id, price_id),
  FOREIGN KEY (transaction_id) REFERENCES paddle_transaction(id) ON DELETE CASCADE,
  FOREIGN KEY (price_id) REFERENCES paddle_price(id) ON DELETE CASCADE
) STRICT;
