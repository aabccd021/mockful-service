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
    let
      name = lib.strings.removeSuffix ".sh" filename;
    in
    pkgs.runCommandLocal "${prefix}${name}"
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
      buildInputs,
      dir,
    }:
    let
      prefix = "test-${builtins.baseNameOf dir}-";
    in
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

in

(mapTests {
  dir = ./google-auth;
  buildInputs = [
    pkgs.jq
    pkgs.netero-test
    pkgs.jwt-cli
    pkgs.tinyxxd
    pkgs.sqlite
    (mkServer "google-auth-client" ./google-auth-client.ts)
  ];
})
// (mapTests {
  dir = ./google-token;
  buildInputs = [
    pkgs.jq
    pkgs.netero-test
    pkgs.curl
    pkgs.sqlite
    (mkServer "google-token-client" ./google-token-client.ts)
  ];
})
