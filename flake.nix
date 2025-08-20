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
        overlays = [ overlays.default ];
      };

      treefmtEval = inputs.treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.nixfmt.enable = true;
        programs.biome.enable = true;
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
        programs.biome.formatUnsafe = true;
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

      nodeModules = inputs.bun2nix.lib.x86_64-linux.mkBunNodeModules {
        packages = import ./bun.nix;
      };

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

      test = lib.pipe ./test [
        builtins.readDir
        lib.attrNames
        (builtins.map (dir: ./test + "/${dir}"))
        (builtins.map mapTests)
        lib.attrsets.mergeAttrsList
      ];

      tsc = pkgs.runCommand "tsc" { } ''
        cp -Lr ${nodeModules}/node_modules ./node_modules
        cp -Lr ${./src} ./src
        cp -L ${./tsconfig.json} ./tsconfig.json
        ${pkgs.typescript}/bin/tsc
        touch "$out"
      '';

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
