{ pkgs }:
let

  lib = pkgs.lib;

  testServer = pkgs.runCommandLocal "server" { } ''
    ${pkgs.bun}/bin/bun build ${./server.ts} \
      --compile \
      --sourcemap \
      --outfile server
    mkdir -p $out/bin
    mv server $out/bin/server
  '';

  test = testFile:
    pkgs.runCommandLocal ""
      {
        buildInputs = [
          pkgs.jq
          pkgs.netero-test
          pkgs.auth-mock
          pkgs.tree
          pkgs.jwt-cli
          testServer
        ];
      } ''
      export NETERO_DIR="$PWD/var/lib/netero"
      mkdir -p "$NETERO_DIR"

      mkfifo "$PWD/ready0.fifo"
      mkfifo "$PWD/ready1.fifo"
      mkfifo "$PWD/ready2.fifo"

      cp -Lr ${pkgs.auth-mock.db}/db.sqlite .
      chmod +w db.sqlite

      server 2>&1 | while IFS= read -r line; do
        printf '\033[32m[server]\033[0m %s\n' "$line"
      done &

      auth-mock-server "accounts.google.com" \
        --on-ready-pipe "$PWD/ready1.fifo" \
        --port 3001 2>&1 | while IFS= read -r line; do
        printf '\033[34m[accounts.google.com]\033[0m %s\n' "$line"
      done &

      auth-mock-server "oauth2.googleapis.com" \
        --on-ready-pipe "$PWD/ready2.fifo" \
        --port 3002 2>&1 | while IFS= read -r line; do
        printf '\033[34m[oauth2.googleapis.com]\033[0m %s\n' "$line"
      done &

      cat ./ready0.fifo >/dev/null
      cat ./ready1.fifo >/dev/null
      cat ./ready2.fifo >/dev/null

      test_script=$(cat ${testFile})
      bash -euo pipefail -c "$test_script" 2>&1 | while IFS= read -r line; do
        printf '\033[33m[client]\033[0m %s\n' "$line"
      done

      mkdir $out
    '';

  testFiles = {
    success = test ./success.sh;
    success-no-code-challenge = test ./success-no-code-challenge.sh;
  };

in
lib.mapAttrs'
  (name: value: {
    name = "test-google-" + name;
    value = value.overrideAttrs (oldAttrs: {
      name = "test-google-" + name;
    });
  })
  testFiles
