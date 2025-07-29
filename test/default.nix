{ pkgs }:
let
  lib = pkgs.lib;

  mkServer =
    name: src:
    pkgs.runCommandLocal "server" { } ''
      ${pkgs.bun}/bin/bun build ${src} \
        --compile \
        --minify \
        --bytecode \
        --sourcemap \
        --outfile server
      mkdir -p "$out/bin"
      mv server "$out/bin/"${name}
    '';

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
    {
      prefix,
      filename,
      dir,
      buildInputs,
    }:
    pkgs.runCommandLocal "${prefix}${filename}"
      {
        env.TEST_FILE = filtered dir filename;
        buildInputs = buildInputs ++ [
          pkgs.netero-oauth-mock
        ];
      }
      ''
        green=$(printf "\033[32m")
        reset=$(printf "\033[0m")

        export NETERO_STATE="./var/lib/netero"
        netero-oauth-mock-init

        mkfifo "./oauth-ready.fifo"

        netero-oauth-mock --port 3001 --on-ready-pipe "./oauth-ready.fifo" 2>&1 |
          sed "s/^/''${green}[oauth]''${reset} /" &

        timeout 5 cat ./oauth-ready.fifo

        bash -euo pipefail "$TEST_FILE"

        mkdir "$out"
      '';

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
        value = mkTest {
          prefix = prefix;
          filename = filename;
          dir = dir;
          buildInputs = buildInputs;
        };
      }))
      builtins.listToAttrs
    ];

  normalTests = mapTests {
    prefix = "test-google-normal-";
    dir = ./normal;
    buildInputs = [
      pkgs.jq
      pkgs.netero-test
      pkgs.jwt-cli
      pkgs.tinyxxd
      pkgs.sqlite
      (mkServer "normal-server" ./normal_server.ts)
    ];
  };

  granularTests = mapTests {
    prefix = "test-google-granular-";
    dir = ./granular;
    buildInputs = [
      pkgs.jq
      pkgs.netero-test
      pkgs.curl
      pkgs.sqlite
      (mkServer "granular-server" ./granular_server.ts)
    ];
  };

in
normalTests // granularTests
