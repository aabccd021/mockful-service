trap 'cd $(pwd)' EXIT
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root" || exit

trap 'git reset' EXIT
git add -A

export NETERO_STATE="/tmp/netero-oauth-mock/var/lib/netero"
mkdir -p "$NETERO_STATE/oauth-mock"
cp "$DATA_FILE" "$NETERO_STATE/oauth-mock/data.json"
chmod 644 "$NETERO_STATE/oauth-mock/data.json"

rm -rf ./node_modules
cp --dereference --recursive "$NODE_MODULES/node_modules/" ./node_modules
chmod --recursive u=rwX,g=,o= ./node_modules

fuser -k "3000/tcp" >/dev/null 2>&1 || true
bun --no-clear-screen --hot src/index.ts &

sleep 1

timeout 1 xdg-open "http://localhost:3000/https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=https%3A%2F%2Fexample.com%2Flogin%2Fcallback" || true

wait
