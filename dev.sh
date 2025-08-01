trap 'cd $(pwd)' EXIT
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root" || exit

trap 'git reset' EXIT
git add -A

export NETERO_STATE="/tmp/netero-oauth-mock/var/lib/netero"
rm -rf "$NETERO_STATE"
netero-oauth-mock-init

sqlite3 "$NETERO_STATE/mock.sqlite" <<EOF
INSERT INTO google_project (id) VALUES ('mock_project_id');
INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'yamada-sub', 'yamada@example.com');
INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://example.com');
EOF

rm -rf ./node_modules
cp --dereference --recursive "$NODE_MODULES/node_modules/" ./node_modules
chmod --recursive u=rwX,g=,o= ./node_modules

fuser -k "3000/tcp" >/dev/null 2>&1 || true
bun --no-clear-screen --hot src/index.ts &

sleep 1

params="scope=openid&response_type=code&client_id=mock_client_id&redirect_uri=https%3A%2F%2Fexample.com"
timeout 1 xdg-open "http://localhost:3000/https://accounts.google.com/o/oauth2/v2/auth?$params" || true

wait
