CREATE TABLE discord_webhook(
  id TEXT,
  token TEXT,
  PRIMARY KEY(id, token)
) STRICT;

CREATE TABLE discord_webhook_request(
  webhook_id TEXT NOT NULL,
  webhook_token TEXT NOT NULL,
  method TEXT NOT NULL,
  body TEXT NOT NULL,
  FOREIGN KEY (webhook_id, webhook_token) REFERENCES discord_webhook(id, token) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;
