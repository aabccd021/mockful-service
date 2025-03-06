{ pkgs }:

let

  db = pkgs.runCommand "initial_db" { } ''
    mkdir -p $out
    touch "$out/db.sqlite"
    ${pkgs.miglite}/bin/miglite --migrations ${./migrations} --db "$out/db.sqlite"
  '';

in

pkgs.runCommand "compiled-server"
{
  passthru = {
    db = db;
  };
} ''
  cp -Lr ${./src} ./src
  ${pkgs.bun}/bin/bun build ./src/index.ts \
    --compile \
    --minify \
    --sourcemap \
    --outfile server
  mkdir -p $out/bin
  mv server $out/bin/auth-mock-server
''
