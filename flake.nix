{
  nixConfig.allow-import-from-derivation = false;

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.treefmt-nix.url = "github:numtide/treefmt-nix";
  inputs.netero-test.url = "github:aabccd021/netero-test";
  inputs.bun2nix.url = "github:baileyluTCD/bun2nix";

  outputs = { self, ... }@inputs:
    let

      overlay = (final: prev: {
        netero-oauth-mock = final.runCommand "compiled-server" { } ''
          ${final.bun}/bin/bun build ${./src}/index.ts \
            --compile \
            --minify \
            --sourcemap \
            --bytecode \
            --outfile server
          mkdir -p "$out/bin"
          mv server "$out/bin/netero-oauth-mock"
        '';
      });

      pkgs = import inputs.nixpkgs {
        system = "x86_64-linux";
        overlays = [
          inputs.netero-test.overlays.default
          overlay
        ];
      };

      lib = pkgs.lib;

      test = import ./test { pkgs = pkgs; };

      treefmtEval = inputs.treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.prettier.enable = true;
        programs.nixpkgs-fmt.enable = true;
        programs.biome.enable = true;
        programs.shfmt.enable = true;
        settings.formatter.prettier.priority = 1;
        settings.formatter.biome.priority = 2;
        settings.global.excludes = [ "LICENSE" "*.ico" "*.sql" ];
      };

      formatter = treefmtEval.config.build.wrapper;

      nodeModules = inputs.bun2nix.lib.x86_64-linux.mkBunNodeModules (import ./bun.nix);

      typeCheck = pkgs.runCommand "typeCheck" { } ''
        cp -Lr ${nodeModules}/node_modules ./node_modules
        cp -Lr ${./src} ./src
        cp -L ${./tsconfig.json} ./tsconfig.json
        ${lib.getExe pkgs.typescript}
        touch $out
      '';

      lintCheck = pkgs.runCommand "lintCheck" { } ''
        cp -Lr ${nodeModules}/node_modules ./node_modules
        cp -Lr ${./src} ./src
        cp -L ${./biome.jsonc} ./biome.jsonc
        cp -L ${./tsconfig.json} ./tsconfig.json
        cp -L ${./package.json} ./package.json
        ${lib.getExe pkgs.biome} check --error-on-warnings
        touch $out
      '';

      packages = devShells // test // {
        tests = pkgs.linkFarm "tests" test;
        formatting = treefmtEval.config.build.check self;
        formatter = formatter;
        typeCheck = typeCheck;
        lintCheck = lintCheck;
        bun2nix = inputs.bun2nix.packages.x86_64-linux.default;
        default = pkgs.netero-oauth-mock;
        netero-oauth-mock = pkgs.netero-oauth-mock;
      };

      devShells.default = pkgs.mkShellNoCC {
        buildInputs = [
          pkgs.bun
          pkgs.biome
          pkgs.typescript
          pkgs.typescript-language-server
          pkgs.vscode-langservers-extracted
          pkgs.nixd
        ];
      };

    in

    {

      packages.x86_64-linux = packages // {
        gcroot = pkgs.linkFarm "gcroot" packages;
      };

      checks.x86_64-linux = packages;
      formatter.x86_64-linux = formatter;
      devShells.x86_64-linux = devShells;

      overlays.default = overlay;

    };
}
