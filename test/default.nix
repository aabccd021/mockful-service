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
      name,
      filename,
      dir,
      buildInputs,
    }:
    pkgs.runCommandLocal name
      {
        buildInputs = buildInputs ++ [ pkgs.netero-oauth-mock ];
      }
      ''
        green=$(printf "\033[32m")
        reset=$(printf "\033[0m")

        export NETERO_STATE="./var/lib/netero"
        netero-oauth-mock-init

        netero-oauth-mock-prepare
        netero-oauth-mock --port 3001  2>&1 | sed "s/^/''${green}[oauth]''${reset} /" &
        netero-oauth-mock-wait

        bash -euo pipefail ${filtered dir filename}

        mkdir "$out"
      '';

  mapTests =
    dir: buildInputs:
    lib.pipe dir [
      builtins.readDir
      builtins.attrNames
      (builtins.map (
        filename:
        let
          name = "test-${builtins.baseNameOf dir}-" + (lib.strings.removeSuffix ".sh" filename);
        in
        {
          name = name;
          value = mkTest {
            name = name;
            filename = filename;
            dir = dir;
            buildInputs = buildInputs;
          };
        }
      ))
      builtins.listToAttrs
    ];

  tests = [
    (mapTests ./google-auth [
      pkgs.jq
      pkgs.netero-test
      pkgs.jwt-cli
      pkgs.tinyxxd
      pkgs.sqlite
      (buildTs ./google-auth-client.ts)
    ])
    (mapTests ./google-token [
      pkgs.jq
      pkgs.netero-test
      pkgs.curl
      pkgs.sqlite
      (buildTs ./google-token-client.ts)
    ])
    (mapTests ./paddle-customer [
      pkgs.curl
      pkgs.sqlite
      pkgs.nodePackages.json-diff
      pkgs.jq
    ])
  ];

in
lib.attrsets.mergeAttrsList tests
