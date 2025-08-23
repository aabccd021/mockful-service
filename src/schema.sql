CREATE TABLE global_static_route(
  url TEXT PRIMARY KEY,
  status INTEGER NOT NULL,
  body TEXT NOT NULL
) STRICT; 

CREATE TABLE global_static_route_header(
  global_static_route_url TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (global_static_route_url) REFERENCES global_static_route(url) ON UPDATE CASCADE ON DELETE CASCADE,
  unique (global_static_route_url, name)
) STRICT;

CREATE TABLE global_captured_response(
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  body TEXT NOT NULL
) STRICT;

CREATE TABLE global_captured_response_header(
  global_captured_response_id TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (global_captured_response_id) REFERENCES global_captured_response(id) ON UPDATE CASCADE ON DELETE CASCADE,
  unique (global_captured_response_id, name)
) STRICT;

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

CREATE TABLE paddle_account (
  id TEXT PRIMARY KEY,
  tax_mode TEXT NOT NULL DEFAULT 'internal',
  CHECK (tax_mode IN ('internal', 'external'))
) STRICT;

CREATE TABLE paddle_account_tax_category_enabled (
  tax_category TEXT NOT NULL,
  account_id TEXT NOT NULL,
  PRIMARY KEY (tax_category, account_id),
  CHECK (tax_category IN ('digital-goods', 'ebooks', 'implementation-services', 'professional-services', 'saas', 'software-programming-services', 'standard', 'training-services', 'website-hosting'))
) STRICT;

CREATE TABLE paddle_api_key (
  key TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  CHECK (key LIKE 'pdl_live_apikey_%' OR key LIKE 'pdl_sdbx_apikey_%'), -- https://developer.paddle.com/api-reference/about/api-keys#format
  CHECK (LENGTH(key) = 69),
  FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_customer (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  marketing_consent TEXT NOT NULL DEFAULT 'false',
  locale TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  UNIQUE (account_id, email),
  CHECK (id LIKE 'ctm_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CHECK (status IN ('active', 'archived')),
  CHECK (marketing_consent IN ('true', 'false')),
  FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_product (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tax_category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active',
  image_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  CHECK (id LIKE 'pro_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CHECK (tax_category IN ('digital-goods', 'ebooks', 'implementation-services', 'professional-services', 'saas', 'software-programming-services', 'standard', 'training-services', 'website-hosting')),
  CHECK (type IN ('standard', 'custom')),
  CHECK (status IN ('active', 'archived')),
  FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_price (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  product_id TEXT NOT NULL,
  unit_price_amount INTEGER NOT NULL,
  unit_price_currency_code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard',
  billing_cycle_frequency INTEGER,
  billing_cycle_interval TEXT,
  tax_mode TEXT NOT NULL DEFAULT 'account_setting',
  quantity_minimum INTEGER NOT NULL DEFAULT 1,
  quantity_maximum INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (id LIKE 'pri_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CHECK (unit_price_amount >= 0),
  CHECK (unit_price_currency_code IN ( 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'SEK', 'ARS', 'BRL', 'CNY', 'COP', 'CZK', 'DKK', 'HUF', 'ILS', 'INR', 'KRW', 'MXN', 'NOK', 'NZD', 'PLN', 'RUB', 'THB', 'TRY', 'TWD', 'UAH', 'VND', 'ZAR')),
  CHECK (type IN ('standard', 'custom')),
  CHECK ((billing_cycle_frequency IS NOT NULL AND billing_cycle_interval IS NOT NULL) OR (billing_cycle_frequency IS NULL AND billing_cycle_interval IS NULL)),
  CHECK (billing_cycle_frequency IS NULL OR billing_cycle_frequency > 0),
  CHECK (billing_cycle_interval IN ('day', 'week', 'month', 'year')),
  CHECK (tax_mode IN ('account_setting', 'external', 'internal')),
  CHECK (quantity_minimum >= 1),
  CHECK (quantity_maximum >= quantity_minimum),
  CHECK (status IN ('active', 'archived')),
  FOREIGN KEY (product_id) REFERENCES paddle_product(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft',
  customer_id TEXT NOT NULL,
  collection_mode TEXT NOT NULL DEFAULT 'automatic',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (id LIKE 'txn_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (SUBSTR(id, 5, 26) GLOB '[a-z0-9]*'),
  CHECK (status IN ('draft', 'ready', 'billed', 'paid', 'completed', 'canceled', 'past_due')),
  CHECK (collection_mode IN ('automatic', 'manual')),
  FOREIGN KEY (customer_id) REFERENCES paddle_customer(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE paddle_transaction_item (
  transaction_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (transaction_id, price_id),
  FOREIGN KEY (transaction_id) REFERENCES paddle_transaction(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (price_id) REFERENCES paddle_price(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;
