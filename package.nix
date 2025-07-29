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

  netero-oauth-mock-prepare = pkgs.writeShellApplication {
    name = "netero-oauth-mock-prepare";
    text = ''
      rm -f "/tmp/$PPID-netero-oauth-mock.fifo" > /dev/null 2>&1 || true
      mkfifo "/tmp/$PPID-netero-oauth-mock.fifo"
    '';
  };

  netero-oauth-mock-wait = pkgs.writeShellApplication {
    name = "netero-oauth-mock-wait";
    text = ''
      cat "/tmp/$PPID-netero-oauth-mock.fifo"
    '';
  };

in
pkgs.symlinkJoin {
  name = "netero-oauth-mock";
  paths = [
    netero-oauth-mock
    netero-oauth-mock-init
    netero-oauth-mock-prepare
    netero-oauth-mock-wait
  ];
}
