green=$(printf "\033[32m")
yellow=$(printf "\033[33m")
blue=$(printf "\033[34m")
reset=$(printf "\033[0m")

export NETERO_STATE="./var/lib/netero"
netero-init
netero-oauth-mock-init
sqlite3 "$NETERO_STATE/mock.sqlite" <<EOF
INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('nijika-sub', 'nijika@example.com', 'true');

INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('yamada-sub', 'yamada@example.com', 'false');

INSERT INTO google_auth_user (sub, email)
  VALUES ('kita-sub', 'kita@example.com');

INSERT INTO google_auth_client (id, secret)
  VALUES ('mock_client_id', 'mock_client_secret');

INSERT INTO paddle_tenant (id) VALUES ('mock_tenant_id');

INSERT INTO paddle_api_key (tenant_id, key)
  VALUES (
    'mock_tenant_id', 
    'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
  );
EOF

mkfifo "./server-ready.fifo"
mkfifo "./oauth-ready.fifo"

server 2>&1 | sed "s/^/${yellow}[server]${reset} /" &

netero-oauth-mock --port 3001 --on-ready-pipe "./oauth-ready.fifo" 2>&1 |
  sed "s/^/${green}[oauth]${reset} /" &

timeout 5 cat ./server-ready.fifo >/dev/null
timeout 5 cat ./oauth-ready.fifo >/dev/null

bash -euo pipefail "$TEST_FILE" 2>&1 | sed "s/^/${blue}[test]${reset} /"

mkdir $out
