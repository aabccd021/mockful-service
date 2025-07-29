sqlite3 "$NETERO_STATE/mock.sqlite" <<EOF
INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('nijika-sub', 'nijika@example.com', 'true');

INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('yamada-sub', 'yamada@example.com', 'false');

INSERT INTO google_auth_user (sub, email)
  VALUES ('kita-sub', 'kita@example.com');

INSERT INTO google_auth_client (id, secret)
  VALUES ('mock_client_id', 'mock_client_secret');
EOF

response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:3001/non-existent-path")

if [ "$response" != "404" ]; then
  echo "Expected 404 status code, got: $response"
  exit 1
fi
