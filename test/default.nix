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
        mkfifo ./ready.fifo
        ${pkgs.netero-oauth-mock}/bin/netero-oauth-mock --port 3001 --db ./mock.sqlite --wait-fifo ./ready.fifo &
        cat ./ready.fifo

        ln -s ${nodeModules}/node_modules ./node_modules
        cp -L ${src}/${filename} .
        timeout 5 ${pkgs.bun}/bin/bun ./${filename}

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

    (mapTests ./paddle-customer-create)
    (mapTests ./paddle-customer-list)
    (mapTests ./paddle-product-create)
    (mapTests ./paddle-product-list)
    (mapTests ./paddle-price-create)
    (mapTests ./paddle-price-list)
  ];

in
lib.attrsets.mergeAttrsList tests
