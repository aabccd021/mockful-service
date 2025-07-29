{ pkgs }:
let
  lib = pkgs.lib;

  buildTs =
    src:
    let
      name = lib.strings.removeSuffix ".ts" (builtins.baseNameOf src);
    in
    pkgs.runCommandLocal name { } ''
      ${pkgs.bun}/bin/bun build ${src} \
        --compile \
        --minify \
        --bytecode \
        --sourcemap \
        --outfile exe
      mkdir -p "$out/bin"
      mv exe "$out/bin/"${name}
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

        netero-oauth-mock-prepare
        netero-oauth-mock --port 3001  2>&1 | sed "s/^/''${green}[oauth]''${reset} /" &
        netero-oauth-mock-wait

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

  tests = [
    {
      dir = ./google-auth;
      buildInputs = [
        pkgs.jq
        pkgs.netero-test
        pkgs.jwt-cli
        pkgs.tinyxxd
        pkgs.sqlite
        (buildTs ./google-auth-client.ts)
      ];
    }
    {
      dir = ./google-token;
      buildInputs = [
        pkgs.jq
        pkgs.netero-test
        pkgs.curl
        pkgs.sqlite
        (buildTs ./google-token-client.ts)
      ];
    }
  ];

in
lib.attrsets.mergeAttrsList (builtins.map mapTests tests)
