{ pkgs, buildNodeModules }:

let
  nodeModules = buildNodeModules pkgs ./package.json ./package-lock.json;

  db = pkgs.runCommand "initial_db" { } ''
    mkdir -p $out
    touch "$out/db.sqlite"
    ${pkgs.miglite}/bin/miglite --migrations ${./migrations} --db "$out/db.sqlite"
  '';

in

pkgs.runCommand "compiled-server"
{
  passthru = {
    nodeModules = nodeModules;
    db = db;
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
  mv server $out/bin/auth-mock-server
''
