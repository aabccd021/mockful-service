{ pkgs, nodeModules }:
let
  lib = pkgs.lib;

  mkTest =
    dir: filename:

    let
      name = "test-${builtins.baseNameOf dir}-" + (lib.strings.removeSuffix ".ts" filename);
      src = lib.fileset.toSource {
        root = dir;
        fileset = dir + "/${filename}";
      };
      value = pkgs.runCommand name { } ''
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
        ${pkgs.bun}/bin/bun ./${filename}

        mkdir "$out"
      '';

    in
    {
      name = name;
      value = value;
    };

  mapTests =
    dir:
    lib.pipe dir [
      builtins.readDir
      builtins.attrNames
      (builtins.map (mkTest dir))
      builtins.listToAttrs
    ];

  tests = [
    (mapTests ./google-auth)
    (mapTests ./google-token)
  ];

in
lib.attrsets.mergeAttrsList tests
