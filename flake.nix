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
          netero-oauth-mock = import ./package.nix {
            pkgs = final;
            nodeModules = nodeModules;
          };
        }
      );

      pkgs = import inputs.nixpkgs {
        system = "x86_64-linux";
        overlays = [
          inputs.netero-test.overlays.default
          overlays.default
        ];
      };

      test = import ./test {
        pkgs = pkgs;
        nodeModules = nodeModules;
      };

      treefmtEval = inputs.treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.nixfmt.enable = true;
        programs.biome.enable = true;
        programs.biome.settings.formatter.indentStyle = "space";
        programs.biome.settings.formatter.lineWidth = 100;
        programs.biome.settings.linter.rules.complexity.useLiteralKeys = "off";
        programs.biome.settings.linter.rules.suspicious.noConsole.level = "error";
        programs.biome.settings.linter.rules.suspicious.noConsole.options.allow = [ "error" ];
        programs.biome.formatUnsafe = true;
        settings.formatter.biome.options = [ "--vcs-enabled=false" ];
        programs.shfmt.enable = true;
        programs.shellcheck.enable = true;
        settings.formatter.shellcheck.options = [
          "-s"
          "sh"
        ];
        settings.global.excludes = [
          "LICENSE"
          "*.sql"
        ];
      };

      formatter = treefmtEval.config.build.wrapper;

      tsc = pkgs.runCommand "tsc" { } ''
        cp -Lr ${nodeModules}/node_modules ./node_modules
        cp -Lr ${./src} ./src
        cp -L ${./tsconfig.json} ./tsconfig.json
        ${pkgs.typescript}/bin/tsc
        touch "$out"
      '';

      inputPackages = {
        nixd = pkgs.nixd;
        typescript = pkgs.typescript;
        typescript-language-server = pkgs.typescript-language-server;
        vscode-langservers-extracted = pkgs.vscode-langservers-extracted;
      };

      dev = pkgs.writeShellApplication {
        name = "dev";
        runtimeInputs = [
          pkgs.bun
          pkgs.netero-oauth-mock
          pkgs.sqlite
        ];
        runtimeEnv.NODE_MODULES = nodeModules;
        text = builtins.readFile ./dev.sh;
      };

      packages =
        devShells
        // test
        // inputPackages
        // {
          dev = dev;
          tests = pkgs.linkFarm "tests" test;
          formatting = treefmtEval.config.build.check self;
          formatter = formatter;
          allInputs = collectInputs inputs;
          tsc = tsc;
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
