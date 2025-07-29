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

netero-init
mkfifo "./server-ready.fifo"
google-token-client 2>&1 &
timeout 5 cat ./server-ready.fifo

goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert-response-code-equal 200

submit "//form" --submit-button "//form/button[@value='kita-sub']"

assert-response-code-equal 200

auth_header=$(printf "mock_client_id:mock_client_secret" | base64)

curl \
  --output "$NETERO_STATE/browser/1/tab/1/page.html" \
  --write-out "%output{$NETERO_STATE/browser/1/tab/1/url.txt}%{url_effective}%output{./header.json}%{header_json}%output{$NETERO_STATE/browser/1/tab/1/response.json}%{json}" \
  --show-error \
  --silent \
  --location \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header "Authorization: Basic $auth_header" \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=aab' \
  --data-urlencode 'redirect_uri=http://localhost:3000/login-callback' \
  'http://localhost:3001/https://oauth2.googleapis.com/token'

assert-response-code-equal 400
assert-query-returns-equal "//text()" 'Auth session not found for code: "aab".'
