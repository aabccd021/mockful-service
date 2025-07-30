INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('nijika-sub', 'nijika@example.com', 'true');

INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('yamada-sub', 'yamada@example.com', 'false');

INSERT INTO google_auth_user (sub, email)
  VALUES ('kita-sub', 'kita@example.com');

INSERT INTO google_auth_client (id, secret)
  VALUES ('mock_client_id', 'mock_client_secret');

-- INSERT INTO paddle_project (id) VALUES ('mock_project_id');
--
-- INSERT INTO paddle_api_key (project_id, key)
--   VALUES (
--     'mock_project_id', 
--     'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
--   );
--
-- INSERT INTO paddle_customer (project_id, id, email)
--   VALUES (
--     'mock_project_id', 
--     'ctm_01k12d0myryxjwp6ckgs3q6sz0',
--     'jo@example.com'
--   );
--
-- INSERT INTO paddle_product (project_id, id)
--   VALUES (
--     'mock_project_id',
--     'pro_01jwq53zc9rs314acj69gf098j'
--   );
--
-- INSERT INTO paddle_price (project_id, product_id, id)
--   VALUES (
--     'mock_project_id',
--     'pro_01jwq53zc9rs314acj69gf098j',
--     'pri_01gsz91wy9k1yn7kx82aafwvea'
--   );
--
-- INSERT INTO paddle_transaction (project_id, customer_id, id)
--   VALUES (
--     'mock_project_id',
--     'ctm_01k12d0myryxjwp6ckgs3q6sz0',
--     'txn_01gt261m3y0bngp73j1j8c6dge'
--   );
--
-- INSERT INTO paddle_transaction_item (transaction_id, price_id, quantity)
--   VALUES (
--     'txn_01gt261m3y0bngp73j1j8c6dge',
--     'pri_01gsz91wy9k1yn7kx82aafwvea',
--     1
--   );
