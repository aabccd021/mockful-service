{
  nixConfig.allow-import-from-derivation = false;

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    netero-test.url = "github:aabccd021/netero-test";
  };

  outputs = { self, nixpkgs, treefmt-nix, netero-test }:
    let

      overlay = (final: prev: {
        netero-oauth-mock = final.runCommand "compiled-server" { } ''
          cp -Lr ${./src} ./src
          ${final.bun}/bin/bun build ./src/index.ts \
            --compile \
            --minify \
            --sourcemap \
            --bytecode \
            --outfile server
          mkdir -p "$out/bin"
          mv server "$out/bin/netero-oauth-mock"
        '';
      });

      pkgs = import nixpkgs {
        system = "x86_64-linux";
        overlays = [
          netero-test.overlays.default
          overlay
        ];
      };

      test = import ./test { pkgs = pkgs; };

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

      biome = pkgs.runCommandNoCCLocal "biome" { } ''
        cp -Lr ${./src} ./src
        cp -L ${./biome.jsonc} ./biome.jsonc
        ${pkgs.biome}/bin/biome check --error-on-warnings
        touch "$out"
      '';

      packages = test // {
        tests = pkgs.linkFarm "tests" test;
        formatting = treefmtEval.config.build.check self;
        biome = biome;
        default = pkgs.netero-oauth-mock;
        netero-oauth-mock = pkgs.netero-oauth-mock;
      };

      gcroot = packages // {
        gcroot = pkgs.linkFarm "gcroot" packages;
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

      apps.x86_64-linux.fix = {
        type = "app";
        program = "${pkgs.typescript}/bin/tsc";
      };

    };
}
