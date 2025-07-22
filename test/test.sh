green=$(printf "\033[32m")
yellow=$(printf "\033[33m")
blue=$(printf "\033[34m")
reset=$(printf "\033[0m")

export NETERO_STATE="./var/lib/netero"
netero_init

mkfifo "./server-ready.fifo"
mkfifo "./oauth-ready.fifo"

server 2>&1 | sed "s/^/${yellow}[server]${reset} /" &

netero-oauth-mock \
  --data "$DATA_FILE" \
  --on-ready-pipe "./oauth-ready.fifo" \
  --port 3001 2>&1 | sed "s/^/${green}[oauth]${reset} /" &

timeout 5 cat ./server-ready.fifo >/dev/null
timeout 5 cat ./oauth-ready.fifo >/dev/null

bash -euo pipefail "$TEST_FILE" 2>&1 | sed "s/^/${blue}[test]${reset} /"

mkdir $out
