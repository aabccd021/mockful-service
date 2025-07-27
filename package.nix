{ nodeModules, pkgs }:
let

  netero-oauth-mock = pkgs.runCommand "netero-oauth-mock" { } ''
    cp -Lr ${nodeModules}/node_modules ./node_modules
    cp -Lr ${./src} ./src
    cp -L ${./tsconfig.json} ./tsconfig.json
    ${pkgs.bun}/bin/bun build ./src/index.ts \
      --compile \
      --minify \
      --sourcemap \
      --bytecode \
      --outfile server
    mkdir -p "$out/bin"
    mv server "$out/bin/netero-oauth-mock"
  '';

  netero-oauth-mock-init = pkgs.writeShellApplication {
    name = "netero-oauth-mock-init";
    runtimeInputs = [
      pkgs.bun
      pkgs.sqlite
    ];
    text = ''
      if [ -z "$NETERO_STATE" ]; then
        echo "NETERO_STATE environment variable is not set."
        exit 1
      fi
      mkdir -p "$NETERO_STATE"
      sqlite3 "$NETERO_STATE/mock.sqlite" < ${./schema.sql}
    '';
  };

in
pkgs.symlinkJoin {
  name = "netero-oauth-mock";
  paths = [
    netero-oauth-mock
    netero-oauth-mock-init
  ];
}
