green=$(printf "\033[32m")
yellow=$(printf "\033[33m")
blue=$(printf "\033[34m")
reset=$(printf "\033[0m")

export NETERO_STATE="./var/lib/netero"
netero-init
netero-oauth-mock-init
sqlite3 "$NETERO_STATE/mock.sqlite" <"$SEED_FILE"

mkfifo "./server-ready.fifo"
mkfifo "./oauth-ready.fifo"

server 2>&1 | sed "s/^/${yellow}[server]${reset} /" &

netero-oauth-mock --port 3001 --on-ready-pipe "./oauth-ready.fifo" 2>&1 |
  sed "s/^/${green}[oauth]${reset} /" &

timeout 5 cat ./server-ready.fifo >/dev/null
timeout 5 cat ./oauth-ready.fifo >/dev/null

ls $("$TEST_FILE")
ls "$TEST_FILE"
bash -euo pipefail "$TEST_FILE" 2>&1 | sed "s/^/${blue}[test]${reset} /"

mkdir $out
