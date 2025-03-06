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

  mkTest = { name, testFile, server }:
    pkgs.runCommandLocal name
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
      export NETERO_DIR="./var/lib/netero"
      mkdir -p "$NETERO_DIR"

      mkfifo "./ready0.fifo"
      mkfifo "./ready1.fifo"

      cp -Lr ${pkgs.auth-mock.db}/db.sqlite .
      chmod +w db.sqlite

      server 2>&1 | while IFS= read -r line; do
        printf '\033[32m[server]\033[0m %s\n' "$line"
      done &

      auth-mock-server \
        --db "./db.sqlite" \
        --on-ready-pipe "./ready1.fifo" \
        --port 3001 2>&1 | while IFS= read -r line; do
        printf '\033[34m[accounts.google.com]\033[0m %s\n' "$line"
      done &

      timeout 5 cat ./ready0.fifo >/dev/null
      timeout 5 cat ./ready1.fifo >/dev/null

      test_script=$(cat ${testFile})
      bash -euo pipefail -c "$test_script" 2>&1 | while IFS= read -r line; do
        printf '\033[33m[client]\033[0m %s\n' "$line"
      done

      mkdir $out
    '';

  mapTests = prefix: server: lib.mapAttrs'
    (name: testFile: {
      name = prefix + name;
      value = mkTest {
        name = prefix + name;
        testFile = testFile;
        server = server;
      };
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
    auth-not-basic = ./granular/auth-not-basic.sh;
    auth-session-not-found = ./granular/auth-session-not-found.sh;
    callback-url-mismatch = ./granular/callback-url-mismatch.sh;
    client-id-mismatch = ./granular/client-id-mismatch.sh;
    client-secret-mismatch = ./granular/client-secret-mismatch.sh;
    invalid-grant-type = ./granular/invalid-grant-type.sh;
    no-code = ./granular/no-code.sh;
    no-code-verifier = ./granular/no-code-verifier.sh;
    no-credentials = ./granular/no-credentials.sh;
    no-grant-type = ./granular/no-grant-type.sh;
    no-auth-header = ./granular/no-auth-header.sh;
    success = ./granular/success.sh;
    success-s256 = ./granular/success-s256.sh;
  };

in
normalTests // granularTests
