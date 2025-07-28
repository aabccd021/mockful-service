{ pkgs }:
let
  lib = pkgs.lib;

  mkServer =
    src:
    pkgs.runCommandLocal "server" { } ''
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

  filtered =
    dir: filename:
    let
      src = lib.fileset.toSource {
        root = dir;
        fileset = dir + "/${filename}";
      };
    in
    "${src}/${filename}";

  mkTest =
    prefix: server: dir: name:
    pkgs.runCommandLocal "${prefix}${name}" {
      env.TEST_FILE = filtered dir name;
      env.SEED_FILE = "${./seed.sql}";
      buildInputs = [
        pkgs.jq
        pkgs.netero-test
        pkgs.netero-oauth-mock
        pkgs.jwt-cli
        pkgs.curl
        pkgs.tinyxxd
        pkgs.sqlite
        server
      ];
    } (builtins.readFile ./test.sh);

  mapTests =
    prefix: server: dir:
    let
      filenames = builtins.attrNames (builtins.readDir dir);
    in
    builtins.listToAttrs (
      builtins.map (name: {
        name = prefix + (lib.strings.removeSuffix ".sh" name);
        value = mkTest prefix server dir name;
      }) filenames
    );

  normalTests = mapTests "test-google-normal-" normalServer ./normal;

  granularTests = mapTests "test-google-granular-" granularServer ./granular;

in
normalTests
// granularTests
// {
  normalServer = normalServer;
  granularServer = granularServer;
}
