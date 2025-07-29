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
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert-response-code-equal 200

submit "//form" --submit-button "//form/button[@value='kita-sub']"

assert-response-code-equal 200

payload=$(
  jq -r ".id_token" "$NETERO_STATE/browser/1/tab/1/body" |
    jwt decode --json - |
    jq -r ".payload"
)

sub=$(echo "$payload" | jq -r ".sub")
assert-equal "kita-sub" "$sub"

now=$(date +%s)

exp=$(echo "$payload" | jq -r ".exp")
exp_diff=$((exp - now))
if [ "$exp_diff" -gt 3601 ] || [ "$exp_diff" -lt 3599 ]; then
  echo "exp is not 1 hour from now: $exp"
  exit 1
fi

iat=$(echo "$payload" | jq -r ".iat")
iat_diff=$((iat - now))
if [ "$iat_diff" -gt 1 ] || [ "$iat_diff" -lt -1 ]; then
  echo "iat is not now: $iat"
  exit 1
fi

access_token=$(jq -r ".access_token" "$NETERO_STATE/browser/1/tab/1/body")

at_hash=$(echo "$payload" | jq -r ".at_hash")
expected_at_hash=$(
  printf "%s" "$access_token" |
    sha256sum |
    cut -c 1-32 |
    xxd -r -p |
    base64 |
    tr '+/' '-_' |
    tr -d '='
)
if [ "$at_hash" != "$expected_at_hash" ]; then
  echo "at_hash mismatch. expected: $expected_at_hash, actual: $at_hash"
  exit 1
fi
