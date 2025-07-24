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
    runtimeInputs = [ pkgs.bun ];
    text = ''
      if [ -z "$NETERO_STATE" ]; then
        echo "NETERO_STATE environment variable is not set."
        exit 1
      fi
      mkdir --parents "$NETERO_STATE/oauth-mock"

      data_file=""

      while [ "$#" -gt 0 ]; do
        case "$1" in
          --data-file)
            data_file="$2"
            shift
            ;;
          *)
            echo "Unknown option: $1"
            exit 1
            ;;
        esac
        shift
      done

      if [ -n "$data_file" ]; then
        cp --dereference "$data_file" "$NETERO_STATE/oauth-mock/data.json"
      fi
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
