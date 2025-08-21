{
  nixConfig.allow-import-from-derivation = false;

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.treefmt-nix.url = "github:numtide/treefmt-nix";
  inputs.netero-test.url = "github:aabccd021/netero-test";
  inputs.bun2nix.url = "github:baileyluTCD/bun2nix";

  outputs =
    { self, ... }@inputs:
    let
      lib = inputs.nixpkgs.lib;

      overlays.default = (
        final: prev: {
          netero-oauth-mock = final.runCommand "netero-oauth-mock" { } ''
            cp -Lr ${./src} ./src
            cp -L ${./tsconfig.json} ./tsconfig.json
            ${final.bun}/bin/bun build ./src/index.ts --compile --bytecode --sourcemap --outfile server
            mkdir -p "$out/bin"
            mv server "$out/bin/netero-oauth-mock"
          '';
        }
      );

      pkgs = import inputs.nixpkgs {
        system = "x86_64-linux";
        overlays = [ overlays.default ];
      };

      treefmtEval = inputs.treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.nixfmt.enable = true;
        programs.biome.enable = true;
        programs.biome.formatUnsafe = true;
        programs.biome.settings.formatter.indentStyle = "space";
        programs.biome.settings.formatter.lineWidth = 100;
        programs.biome.settings.linter.rules.complexity.useLiteralKeys = "off";
        programs.biome.settings.linter.rules.suspicious.noConsole.level = "error";
        programs.biome.settings.linter.rules.suspicious.noConsole.options.allow = [
          "error"
          "warning"
          "info"
          "assert"
        ];
        settings.global.excludes = [
          "LICENSE"
          "*.sql"
        ];
      };

      nodeModules = inputs.bun2nix.lib.x86_64-linux.mkBunNodeModules {
        packages = import ./bun.nix;
      };

      tsc = pkgs.runCommand "tsc" { } ''
        cp -Lr ${nodeModules}/node_modules ./node_modules
        cp -Lr ${./src} ./src
        cp -L ${./tsconfig.json} ./tsconfig.json
        ${pkgs.typescript}/bin/tsc
        touch "$out"
      '';

      mkTest =
        filename:
        let
          name = "test-" + (lib.strings.removeSuffix ".ts" filename);
          src = lib.fileset.toSource {
            root = ./test;
            fileset = ./test + "/${filename}";
          };
          value = pkgs.runCommand name { } ''
            ln -s ${nodeModules}/node_modules ./node_modules
            mkdir -p dist
            cp -Lr ${pkgs.netero-oauth-mock}/bin/netero-oauth-mock ./dist/netero-oauth-mock
            mkdir -p test
            cp -L ${./test/util.ts} ./test/util.ts
            cp -L ${src}/${filename} ./test/${filename}
            timeout 5 ${pkgs.bun}/bin/bun ./test/${filename}
            mkdir "$out"
          '';
        in
        {
          name = name;
          value = value;
        };

      test = lib.pipe ./test [
        builtins.readDir
        builtins.attrNames
        (builtins.filter (filename: filename != "util.ts"))
        (builtins.map mkTest)
        builtins.listToAttrs
      ];

      packages = test // {
        tests = pkgs.linkFarm "tests" test;
        formatting = treefmtEval.config.build.check self;
        tsc = tsc;
        default = pkgs.netero-oauth-mock;
        netero-oauth-mock = pkgs.netero-oauth-mock;
      };

    in

    {

      packages.x86_64-linux = packages;

      checks.x86_64-linux = packages;

      formatter.x86_64-linux = treefmtEval.config.build.wrapper;

      overlays = overlays;

      devShells.x86_64-linux.default = pkgs.mkShellNoCC {
        buildInputs = [
          pkgs.nixd
          pkgs.bun
          pkgs.typescript
          pkgs.typescript-language-server
          pkgs.vscode-langservers-extracted
        ];
      };

    };
}
