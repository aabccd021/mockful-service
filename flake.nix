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

      collectInputs =
        is:
        pkgs.linkFarm "inputs" (
          builtins.mapAttrs (
            name: i:
            pkgs.linkFarm name {
              self = i.outPath;
              deps = collectInputs (lib.attrByPath [ "inputs" ] { } i);
            }
          ) is
        );

      nodeModules = inputs.bun2nix.lib.x86_64-linux.mkBunNodeModules {
        packages = import ./bun.nix;
      };

      overlays.default = (
        final: prev: {
          netero-oauth-mock = final.runCommand "compiled-server" { } ''
            cp -Lr ${nodeModules}/node_modules ./node_modules
            cp -Lr ${./src} ./src
            cp -L ${./tsconfig.json} ./tsconfig.json
            ${final.bun}/bin/bun build ./src/index.ts \
              --compile \
              --minify \
              --sourcemap \
              --bytecode \
              --outfile server
            mkdir -p "$out/bin"
            mv server "$out/bin/netero-oauth-mock"
          '';
        }
      );

      pkgs = import inputs.nixpkgs {
        system = "x86_64-linux";
        overlays = [
          inputs.netero-test.overlays.default
          overlays.default
        ];
      };

      test = import ./test { pkgs = pkgs; };

      treefmtEval = inputs.treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.prettier.enable = true;
        programs.nixfmt.enable = true;
        programs.biome.enable = true;
        programs.shfmt.enable = true;
        settings.formatter.prettier.priority = 1;
        settings.formatter.biome.priority = 2;
        settings.global.excludes = [
          "LICENSE"
          "*.ico"
          "*.sql"
        ];
      };

      formatter = treefmtEval.config.build.wrapper;

      typeCheck = pkgs.runCommand "typeCheck" { } ''
        cp -Lr ${nodeModules}/node_modules ./node_modules
        cp -Lr ${./src} ./src
        cp -L ${./tsconfig.json} ./tsconfig.json
        ${pkgs.typescript}/bin/tsc
        touch $out
      '';

      lintCheck = pkgs.runCommand "lintCheck" { } ''
        cp -Lr ${nodeModules}/node_modules ./node_modules
        cp -Lr ${./src} ./src
        cp -L ${./biome.jsonc} ./biome.jsonc
        cp -L ${./tsconfig.json} ./tsconfig.json
        cp -L ${./package.json} ./package.json
        ${pkgs.biome}/bin/biome check --error-on-warnings
        touch $out
      '';

      inputPackages = {
        bun = pkgs.bun;
        biome = pkgs.biome;
        typescript = pkgs.typescript;
        typescript-language-server = pkgs.typescript-language-server;
        vscode-langservers-extracted = pkgs.vscode-langservers-extracted;
        bun2nix = inputs.bun2nix.packages.x86_64-linux.default;
        nixd = pkgs.nixd;
      };

      prefmt = pkgs.writeShellApplication {
        name = "prefmt";
        runtimeInputs = [ pkgs.biome ];
        text = ''
          biome check --fix --unsafe
        '';
      };

      packages =
        devShells
        // test
        // inputPackages
        // {
          prefmt = prefmt;
          tests = pkgs.linkFarm "tests" test;
          formatting = treefmtEval.config.build.check self;
          formatter = formatter;
          allInputs = collectInputs inputs;
          typeCheck = typeCheck;
          lintCheck = lintCheck;
          default = pkgs.netero-oauth-mock;
          netero-oauth-mock = pkgs.netero-oauth-mock;
        };

      devShells.default = pkgs.mkShellNoCC {
        buildInputs = builtins.attrValues inputPackages;
      };

    in

    {

      packages.x86_64-linux = packages // {
        gcroot = pkgs.linkFarm "gcroot" packages;
      };

      checks.x86_64-linux = packages;
      formatter.x86_64-linux = formatter;
      devShells.x86_64-linux = devShells;

      overlays = overlays;

    };
}
