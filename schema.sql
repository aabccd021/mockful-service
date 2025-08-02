CREATE TABLE google_project (
  id TEXT,
  CONSTRAINT google_project_pk PRIMARY KEY (id)
) STRICT;

CREATE TABLE google_auth_session (
  code TEXT,
  scope TEXT,
  code_challenge TEXT,
  code_challenge_method TEXT,
  user_sub TEXT,
  client_id TEXT,
  CONSTRAINT google_auth_session_code_pk PRIMARY KEY (code),
  CONSTRAINT google_auth_session_scope_not_null CHECK (scope IS NOT NULL),
  CONSTRAINT google_auth_session_challenge_method_enum CHECK (code_challenge_method IN ('S256', 'plain')),
  CONSTRAINT google_auth_session_user_sub_not_null CHECK (user_sub IS NOT NULL),
  CONSTRAINT google_auth_session_user_sub_fk FOREIGN KEY (user_sub) REFERENCES google_auth_user(sub) ON DELETE CASCADE,
  CONSTRAINT google_auth_session_client_id_not_null CHECK (client_id IS NOT NULL),
  CONSTRAINT google_auth_session_client_id_fk FOREIGN KEY (client_id) REFERENCES google_auth_client(id) ON DELETE CASCADE
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
  CONSTRAINT paddle_account_pk PRIMARY KEY (id),
  CONSTRAINT paddle_account_tax_mode_enum CHECK (tax_mode IN ('internal', 'external'))
) STRICT;

CREATE TABLE paddle_account_tax_category_enabled (
  tax_category TEXT,
  account_id TEXT,
  CONSTRAINT paddle_account_tax_category_enabled_pk PRIMARY KEY (tax_category, account_id),
  CONSTRAINT paddle_account_tax_category_enabled_tax_category_enum CHECK (tax_category IN ('digital-goods', 'ebooks', 'implementation-services', 'professional-services', 'saas', 'software-programming-services', 'standard', 'training-services', 'website-hosting'))
) STRICT;

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
  locale TEXT,
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
  name TEXT,
  tax_category TEXT,
  description TEXT,
  type TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'active',
  image_url TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  account_id TEXT,
  CONSTRAINT paddle_product_pk PRIMARY KEY (id),
  CONSTRAINT paddle_product_id_prefix CHECK (id LIKE 'pro_%'),
  CONSTRAINT paddle_product_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_product_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_product_tax_category_enum CHECK (tax_category IN ('digital-goods', 'ebooks', 'implementation-services', 'professional-services', 'saas', 'software-programming-services', 'standard', 'training-services', 'website-hosting')),
  CONSTRAINT paddle_product_tax_category_not_null CHECK (tax_category IS NOT NULL),
  CONSTRAINT paddle_product_type_enum CHECK (type IN ('standard', 'custom')),
  CONSTRAINT paddle_product_type_not_null CHECK (type IS NOT NULL),
  CONSTRAINT paddle_product_status_enum CHECK (status IN ('active', 'archived')),
  CONSTRAINT paddle_product_status_not_null CHECK (status IS NOT NULL),
  CONSTRAINT paddle_product_created_at_not_null CHECK (created_at IS NOT NULL),
  CONSTRAINT paddle_product_updated_at_not_null CHECK (updated_at IS NOT NULL),
  CONSTRAINT paddle_product_account_id_not_null CHECK (account_id IS NOT NULL),
  CONSTRAINT paddle_product_account_id_fk FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_price (
  description TEXT,
  product_id TEXT,
  unit_price_amount INTEGER,
  unit_price_currency_code TEXT,
  type TEXT DEFAULT 'standard',
  name TEXT,  
  billing_cycle_frequency INTEGER,
  billing_cycle_interval TEXT,
  tax_mode TEXT DEFAULT 'account_setting',
  quantity_minimum INTEGER DEFAULT 1,
  quantity_maximum INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at INTEGER,
  updated_at INTEGER,
  id TEXT,
  CONSTRAINT paddle_price_pk PRIMARY KEY (id),
  CONSTRAINT paddle_price_id_prefix CHECK (id LIKE 'pri_%'),
  CONSTRAINT paddle_price_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_price_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_price_description_not_null CHECK (description IS NOT NULL),
  CONSTRAINT paddle_price_unit_price_amount_not_null CHECK (unit_price_amount IS NOT NULL),
  CONSTRAINT paddle_price_unit_price_amount_not_negative CHECK (unit_price_amount >= 0),
  CONSTRAINT paddle_price_unit_price_currency_code_not_null CHECK (unit_price_currency_code IS NOT NULL),
  CONSTRAINT paddle_price_unit_price_currency_code_enum CHECK (unit_price_currency_code IN ( 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'SEK', 'ARS', 'BRL', 'CNY', 'COP', 'CZK', 'DKK', 'HUF', 'ILS', 'INR', 'KRW', 'MXN', 'NOK', 'NZD', 'PLN', 'RUB', 'THB', 'TRY', 'TWD', 'UAH', 'VND', 'ZAR')),
  CONSTRAINT paddle_price_type_enum CHECK (type IN ('standard', 'custom')),
  CONSTRAINT paddle_price_type_not_null CHECK (type IS NOT NULL),
  CONSTRAINT paddle_price_billing_cycle_object CHECK ( (billing_cycle_frequency IS NOT NULL AND billing_cycle_interval IS NOT NULL) OR (billing_cycle_frequency IS NULL AND billing_cycle_interval IS NULL)),
  CONSTRAINT paddle_price_billing_cycle_frequency_positive CHECK ( billing_cycle_frequency IS NULL OR billing_cycle_frequency > 0),
  CONSTRAINT paddle_price_billing_cycle_interval_enum CHECK (billing_cycle_interval IN ('day', 'week', 'month', 'year')),
  CONSTRAINT paddle_price_tax_mode_enum CHECK (tax_mode IN ('account_setting', 'external', 'internal')),
  CONSTRAINT paddle_price_tax_mode_not_null CHECK (tax_mode IS NOT NULL),
  CONSTRAINT paddle_price_quantity_minimum_not_null CHECK (quantity_minimum IS NOT NULL),
  CONSTRAINT paddle_price_quantity_minimum_positive CHECK (quantity_minimum >= 1),
  CONSTRAINT paddle_price_quantity_maximum_not_null CHECK (quantity_maximum IS NOT NULL),
  CONSTRAINT paddle_price_quantity_valid CHECK (quantity_maximum >= quantity_minimum),
  CONSTRAINT paddle_price_status_enum CHECK (status IN ('active', 'archived')),
  CONSTRAINT paddle_price_status_not_null CHECK (status IS NOT NULL),
  CONSTRAINT paddle_price_created_at_not_null CHECK (created_at IS NOT NULL),
  CONSTRAINT paddle_price_updated_at_not_null CHECK (updated_at IS NOT NULL),
  CONSTRAINT paddle_price_product_id_not_null CHECK (product_id IS NOT NULL),
  CONSTRAINT paddle_price_product_id_fk FOREIGN KEY (product_id) REFERENCES paddle_product(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction (
  id TEXT,
  status TEXT DEFAULT 'draft',
  customer_id TEXT,
  collection_mode TEXT DEFAULT 'automatic',
  created_at INTEGER,
  updated_at INTEGER,
  CONSTRAINT paddle_transaction_pk PRIMARY KEY (id),
  CONSTRAINT paddle_transaction_id_prefix CHECK (id LIKE 'txn_%'),
  CONSTRAINT paddle_transaction_id_length CHECK (LENGTH(id) = 30),
  CONSTRAINT paddle_transaction_id_pattern CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CONSTRAINT paddle_transaction_status_not_null CHECK (status IS NOT NULL),
  CONSTRAINT paddle_transaction_status_enum CHECK (status IN ('draft', 'ready', 'billed', 'paid', 'completed', 'canceled', 'past_due')),
  CONSTRAINT paddle_transaction_customer_id_fk FOREIGN KEY (customer_id) REFERENCES paddle_customer(id) ON DELETE CASCADE,
  CONSTRAINT paddle_transaction_collection_mode_not_null CHECK (collection_mode IS NOT NULL),
  CONSTRAINT paddle_transaction_collection_mode_enum CHECK (collection_mode IN ('automatic', 'manual')),
  CONSTRAINT paddle_transaction_created_at_not_null CHECK (created_at IS NOT NULL),
  CONSTRAINT paddle_transaction_updated_at_not_null CHECK (updated_at IS NOT NULL)
) STRICT;

CREATE TABLE paddle_transaction_item (
  transaction_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  CONSTRAINT paddle_transaction_item_pk PRIMARY KEY (transaction_id, price_id),
  CONSTRAINT paddle_transaction_item_transaction_id_fk FOREIGN KEY (transaction_id) REFERENCES paddle_transaction(id) ON DELETE CASCADE,
  CONSTRAINT paddle_transaction_item_price_id_fk FOREIGN KEY (price_id) REFERENCES paddle_price(id) ON DELETE CASCADE
) STRICT
