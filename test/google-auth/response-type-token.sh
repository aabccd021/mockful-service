sqlite3 "$NETERO_STATE/mock.sqlite" <<EOF
INSERT INTO google_auth_user (sub, email)
  VALUES ('kita-sub', 'kita@example.com');

INSERT INTO google_auth_client (id, secret)
  VALUES ('mock_client_id', 'mock_client_secret');
EOF

netero-init
mkfifo "./server-ready.fifo"
google-auth-client 2>&1 &
timeout 5 cat ./server-ready.fifo

goto --url "http://localhost:3000\
?response_type=token\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert-response-code-equal 400

assert-query-returns-equal "//text()" 'Invalid response_type: "token". Expected "code".'
