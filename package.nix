{ nodeModules, pkgs }:
pkgs.runCommand "compiled-server" { } ''
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
''
