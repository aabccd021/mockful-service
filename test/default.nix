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
    # https://developers.google.com/identity/protocols/oauth2/web-server
    (mapTests ./google-auth)
    (mapTests ./google-token)

    (mapTests ./paddle-customers-create)
    (mapTests ./paddle-customers-list)
    (mapTests ./paddle-products-create)
    (mapTests ./paddle-products-list)
    (mapTests ./paddle-prices-create)
    (mapTests ./paddle-prices-list)
  ];

in
lib.attrsets.mergeAttrsList tests
