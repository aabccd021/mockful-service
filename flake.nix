{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    build-node-modules.url = "github:aabccd021/build-node-modules";
    netero-test.url = "github:aabccd021/netero-test";
    miglite.url = "github:aabccd021/miglite";
  };

  outputs = { self, nixpkgs, treefmt-nix, build-node-modules, netero-test, miglite }:
    let

      overlay = (final: prev: {
        auth-mock = import ./server.nix { pkgs = final; };
      });

      pkgs = import nixpkgs {
        system = "x86_64-linux";
        overlays = [
          miglite.overlays.default
          netero-test.overlays.default
          overlay
        ];
      };

      test = import ./test {
        pkgs = pkgs;
      };

      nodeModules = build-node-modules.lib.buildNodeModules pkgs ./package.json ./package-lock.json;

      treefmtEval = treefmt-nix.lib.evalModule pkgs {
        projectRootFile = "flake.nix";
        programs.prettier.enable = true;
        programs.nixpkgs-fmt.enable = true;
        programs.biome.enable = true;
        programs.shfmt.enable = true;
        settings.formatter.prettier.priority = 1;
        settings.formatter.biome.priority = 2;
        settings.global.excludes = [ "LICENSE" "*.ico" "*.sql" ];
      };

      tsc = pkgs.runCommandNoCCLocal "tsc" { } ''
        cp -Lr ${./src} ./src
        cp -L ${./package.json} ./package.json
        cp -L ${./tsconfig.json} ./tsconfig.json
        cp -Lr ${nodeModules} ./node_modules
        ${pkgs.typescript}/bin/tsc
        touch $out
      '';

      biome = pkgs.runCommandNoCCLocal "biome" { } ''
        cp -Lr ${./src} ./src
        cp -L ${./biome.jsonc} ./biome.jsonc
        cp -L ${./package.json} ./package.json
        cp -L ${./tsconfig.json} ./tsconfig.json
        cp -Lr ${nodeModules} ./node_modules
        ${pkgs.biome}/bin/biome check --error-on-warnings
        touch $out
      '';

      packages = test // {
        formatting = treefmtEval.config.build.check self;
        tsc = tsc;
        biome = biome;
        nodeModules = nodeModules;
        default = pkgs.auth-mock;
        auth-mock = pkgs.auth-mock;
      };

      gcroot = packages // {
        gcroot-all = pkgs.linkFarm "gcroot-all" packages;
      };

    in

    {

      checks.x86_64-linux = gcroot;

      packages.x86_64-linux = gcroot;

      formatter.x86_64-linux = treefmtEval.config.build.wrapper;

      overlays.default = overlay;

      devShells.x86_64-linux.default = pkgs.mkShellNoCC {
        buildInputs = [
          pkgs.bun
          pkgs.biome
          pkgs.typescript
        ];
      };
    };
}
