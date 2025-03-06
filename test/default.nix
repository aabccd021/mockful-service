{ pkgs }:
let

  lib = pkgs.lib;

  mkServer = src: pkgs.runCommandLocal "server" { } ''
    ${pkgs.bun}/bin/bun build ${src} \
      --compile \
      --sourcemap \
      --outfile server
    mkdir -p $out/bin
    mv server $out/bin/server
  '';

  normalServer = mkServer ./normal_server.ts;
  granularServer = mkServer ./granular_server.ts;

  test = testFile: server:
    pkgs.runCommandLocal ""
      {
        buildInputs = [
          pkgs.jq
          pkgs.netero-test
          pkgs.auth-mock
          pkgs.jwt-cli
          pkgs.curl
          server
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

  mapTests = prefix: server: lib.mapAttrs'
    (name: path: {
      name = prefix + name;
      value =
        let
          v = test path server;
        in
        v.overrideAttrs (oldAttrs: {
          name = prefix + name;
        });
    });

  normalTests = mapTests "test-google-normal-" normalServer {
    empty-scope-no-idtoken = ./normal/empty-scope-no-idtoken.sh;
    no-client-id = ./normal/no-client-id.sh;
    no-redirect-uri = ./normal/no-redirect-uri.sh;
    no-scope = ./normal/no-scope.sh;
    response-type-token = ./normal/response-type-token.sh;
    success = ./normal/success.sh;
    success-s256 = ./normal/success-s256.sh;
    s256-mismatch = ./normal/s256-mismatch.sh;
  };

  granularTests = mapTests "test-google-granular-" granularServer {
    success = ./granular/success.sh;
    success-s256 = ./granular/success-s256.sh;
    no-code-verifier = ./granular/no-code-verifier.sh;
    callback-url-mismatch = ./granular/callback-url-mismatch.sh;
    auth-not-basic = ./granular/auth-not-basic.sh;
    no-credentials = ./granular/no-credentials.sh;
    client-id-mismatch = ./granular/client-id-mismatch.sh;
    client-secret-mismatch = ./granular/client-secret-mismatch.sh;
    invalid-grant-type = ./granular/invalid-grant-type.sh;
    no-grant-type = ./granular/no-grant-type.sh;
    no-code = ./granular/no-code.sh;
    auth-session-not-found = ./granular/auth-session-not-found.sh;
  };

in
normalTests // granularTests
