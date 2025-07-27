trap 'cd $(pwd)' EXIT
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root" || exit

trap 'git reset' EXIT
git add -A

export NETERO_STATE="/tmp/netero-oauth-mock/var/lib/netero"
rm -rf "$NETERO_STATE"
set -x
netero-oauth-mock-init
echo foo

sqlite3 "$NETERO_STATE/mock.sqlite" <<EOF
INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('nijika-sub', 'nijika@example.com', 'true');
INSERT INTO google_auth_user (sub, email, email_verified) 
  VALUES ('yamada-sub', 'yamada@example.com', 'false');
INSERT INTO google_auth_user (sub, email)
  VALUES ('kita-sub', 'kita@example.com');
EOF

rm -rf ./node_modules
cp --dereference --recursive "$NODE_MODULES/node_modules/" ./node_modules
chmod --recursive u=rwX,g=,o= ./node_modules

fuser -k "3000/tcp" >/dev/null 2>&1 || true
bun --no-clear-screen --hot src/index.ts &

sleep 1

timeout 1 xdg-open "http://localhost:3000/https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=https%3A%2F%2Fexample.com%2Flogin%2Fcallback" || true

wait
