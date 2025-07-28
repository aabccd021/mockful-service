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
    prefix: server: dir: filename:
    pkgs.runCommandLocal "${prefix}${filename}" {
      env.TEST_FILE = filtered dir filename;
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
    {
      prefix,
      server,
      dir,
    }:
    lib.pipe dir [
      builtins.readDir
      builtins.attrNames
      (builtins.map (filename: {
        name = prefix + (lib.strings.removeSuffix ".sh" filename);
        value = mkTest prefix server dir filename;
      }))
      builtins.listToAttrs
    ];

  normalTests = mapTests {
    prefix = "test-google-normal-";
    server = normalServer;
    dir = ./normal;
  };

  granularTests = mapTests {
    prefix = "test-google-granular-";
    server = granularServer;
    dir = ./granular;
  };

in
normalTests
// granularTests
// {
  normalServer = normalServer;
  granularServer = granularServer;
}
