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

  mapTests =
    {
      prefix,
      buildInputs,
      dir,
    }:
    lib.pipe dir [
      builtins.readDir
      builtins.attrNames
      (builtins.map (filename: {
        name = prefix + (lib.strings.removeSuffix ".sh" filename);
        value = pkgs.runCommandLocal "${prefix}${filename}" {
          env.TEST_FILE = filtered dir filename;
          buildInputs = buildInputs;
        } (builtins.readFile ./test.sh);
      }))
      builtins.listToAttrs
    ];

  normalTests = mapTests {
    prefix = "test-google-normal-";
    dir = ./normal;
    buildInputs = [
      pkgs.jq
      pkgs.netero-test
      pkgs.netero-oauth-mock
      pkgs.jwt-cli
      pkgs.curl
      pkgs.tinyxxd
      pkgs.sqlite
      normalServer
    ];
  };

  granularTests = mapTests {
    prefix = "test-google-granular-";
    dir = ./granular;
    buildInputs = [
      pkgs.jq
      pkgs.netero-test
      pkgs.netero-oauth-mock
      pkgs.jwt-cli
      pkgs.curl
      pkgs.tinyxxd
      pkgs.sqlite
      granularServer
    ];
  };

in
normalTests
// granularTests
// {
  normalServer = normalServer;
  granularServer = granularServer;
}
