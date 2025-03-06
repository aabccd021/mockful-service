{ pkgs, buildNodeModules }:

let
  nodeModules = buildNodeModules pkgs ./package.json ./package-lock.json;
in

pkgs.runCommand "compiled-server"
{
  passthru = {
    nodeModules = nodeModules;
  };
} ''
  cp -Lr ${nodeModules} ./node_modules
  cp -Lr ${./src} ./src
  cp -L ${./tsconfig.json} ./tsconfig.json
  ${pkgs.bun}/bin/bun build ./src/index.ts \
    --compile \
    --minify \
    --sourcemap \
    --outfile server
  mkdir -p $out/bin
  mv server $out/bin/server
''
