{
  nixConfig.allow-import-from-derivation = false;

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.treefmt-nix.url = "github:numtide/treefmt-nix";
  inputs.netero-test.url = "github:aabccd021/netero-test";

  outputs =
    { self, ... }@inputs:
    let

      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;

      treefmtEval = inputs.treefmt-nix.lib.evalModule pkgs {
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

      packages.formatting = treefmtEval.config.build.check self;

    in

    {

      packages.x86_64-linux = packages;

      checks.x86_64-linux = packages;

      formatter.x86_64-linux = treefmtEval.config.build.wrapper;

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
