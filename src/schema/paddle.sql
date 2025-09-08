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
  account_id TEXT NOT NULL,
  UNIQUE (account_id, email),
  CHECK (id LIKE 'ctm_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (id GLOB '[a-z0-9]*'),
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
  account_id TEXT NOT NULL,
  CHECK (id LIKE 'pro_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (id GLOB '[a-z0-9]*'),
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
  CHECK (id LIKE 'pri_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (id GLOB '[a-z0-9]*'),
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
  created_at TEXT NOT NULL,
  CHECK (id LIKE 'txn_%'),
  CHECK (LENGTH(id) = 30),
  CHECK (id GLOB '[a-z0-9]*'),
  CHECK (status IN ('draft', 'ready', 'billed', 'paid', 'completed', 'canceled', 'past_due')),
  CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
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

CREATE TABLE paddle_hosted_checkout (
  id TEXT PRIMARY KEY,
  redirect_url TEXT NOT NULL,
  account_id TEXT NOT NULL,
  CHECK (id LIKE 'hsc_%'),
  CHECK (LENGTH(id) = 63),
  CHECK (id GLOB '[a-z0-9_]*'),
  FOREIGN KEY (account_id) REFERENCES paddle_account(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TRIGGER paddle_transaction_item_account_match
BEFORE INSERT ON paddle_transaction_item
FOR EACH ROW
BEGIN
  WITH
    customer_account AS (
      SELECT c.account_id AS customer_account_id
      FROM paddle_transaction t
      JOIN paddle_customer c ON t.customer_id = c.id
      WHERE t.id = NEW.transaction_id
    ),
    price_account AS (
      SELECT p.account_id AS price_account_id
      FROM paddle_price pr
      JOIN paddle_product p ON pr.product_id = p.id
      WHERE pr.id = NEW.price_id
    )
  SELECT
    CASE
      WHEN (SELECT customer_account_id FROM customer_account) != (SELECT price_account_id FROM price_account)
      THEN RAISE(ABORT, 'Account mismatch: transaction customer and price must belong to the same account')
    END;
END;
