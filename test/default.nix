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
      mkdir -p "$out/bin"
      mv server "$out/bin/server"
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
    {
      prefix,
      filename,
      dir,
      buildInputs,
    }:
    pkgs.runCommandLocal "${prefix}${filename}"
      {
        env.TEST_FILE = filtered dir filename;
        buildInputs = buildInputs;
      }
      ''
        green=$(printf "\033[32m")
        yellow=$(printf "\033[33m")
        reset=$(printf "\033[0m")

        export NETERO_STATE="./var/lib/netero"
        netero-init
        netero-oauth-mock-init

        mkfifo "./server-ready.fifo"
        mkfifo "./oauth-ready.fifo"

        server 2>&1 | sed "s/^/''${yellow}[server]''${reset} /" &

        netero-oauth-mock --port 3001 --on-ready-pipe "./oauth-ready.fifo" 2>&1 |
          sed "s/^/''${green}[oauth]''${reset} /" &

        timeout 5 cat ./server-ready.fifo
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
