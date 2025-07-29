{ pkgs, nodeModules }:
let
  lib = pkgs.lib;

  mkTest =
    {
      name,
      dir,
      filename,
    }:
    let
      src = lib.fileset.toSource {
        root = dir;
        fileset = dir + "/${filename}";
      };
    in
    pkgs.runCommand name { } ''
      green=$(printf "\033[32m")
      reset=$(printf "\033[0m")

      export NETERO_STATE="./var/lib/netero"
      ${pkgs.netero-oauth-mock}/bin/netero-oauth-mock-init

      ${pkgs.netero-oauth-mock}/bin/netero-oauth-mock-prepare
      ${pkgs.netero-oauth-mock}/bin/netero-oauth-mock --port 3001  2>&1 | 
        sed "s/^/''${green}[mock]''${reset} /" &
      ${pkgs.netero-oauth-mock}/bin/netero-oauth-mock-wait

      ln -s ${nodeModules}/node_modules ./node_modules
      cp -L ${src}/${filename} .
      ${pkgs.bun}/bin/bun test ./${filename}

      mkdir "$out"
    '';

  mapTests =
    dir:
    lib.pipe dir [
      builtins.readDir
      builtins.attrNames
      (builtins.map (
        filename:
        let
          name = "test-${builtins.baseNameOf dir}-" + (lib.strings.removeSuffix ".ts" filename);
        in
        {
          name = name;
          value = mkTest {
            name = name;
            dir = dir;
            filename = filename;
          };
        }
      ))
      builtins.listToAttrs
    ];

  tests = [
    (mapTests ./google-auth2)
    # (mapTests shellTest ./google-token [
    #   pkgs.jq
    #   pkgs.netero-test
    #   pkgs.curl
    #   pkgs.sqlite
    #   pkgs.nodePackages.json-diff
    #   (buildTs ./google-token-client.ts)
    # ])
    # (mapTests shellTest ./paddle-customer [
    #   pkgs.curl
    #   pkgs.sqlite
    #   pkgs.nodePackages.json-diff
    #   pkgs.jq
    # ])
  ];

in
lib.attrsets.mergeAttrsList tests
