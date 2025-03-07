{ pkgs }:
let

  lib = pkgs.lib;

  mkServer = src: pkgs.runCommandLocal "server" { } ''
    ${pkgs.bun}/bin/bun build ${src} \
      --compile \
      --minify \
      --bytecode \
      --sourcemap \
      --outfile server
    mkdir -p $out/bin
    mv server $out/bin/server
  '';

  normalServer = mkServer ./normal_server.ts;
  granularServer = mkServer ./granular_server.ts;

  mkTest = prefix: server: dir: name:
    let
      testFile = dir + "/${name}.sh";
    in
    pkgs.runCommandLocal "${prefix}${name}"
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

  mapTests = prefix: server: dir: names: builtins.listToAttrs (builtins.map
    (name: {
      name = prefix + name;
      value = mkTest prefix server dir name;
    })
    names);

  normalTests = mapTests "test-google-normal-" normalServer ./normal [
    "empty-scope-no-idtoken"
    "no-client-id"
    "no-redirect-uri"
    "no-scope"
    "response-type-token"
    "success"
    "success-s256"
    "s256-mismatch"
  ];

  granularTests = mapTests "test-google-granular-" granularServer ./granular [
    "auth-not-basic"
    "auth-session-not-found"
    "callback-url-mismatch"
    "client-id-mismatch"
    "client-secret-mismatch"
    "invalid-grant-type"
    "no-code"
    "no-code-verifier"
    "no-credentials"
    "no-grant-type"
    "no-auth-header"
    "success"
    "success-s256"
    "get"
  ];

in
normalTests // granularTests // {
  normalServer = normalServer;
  granularServer = granularServer;
}
