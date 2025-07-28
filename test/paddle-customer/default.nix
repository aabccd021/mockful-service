{ pkgs }:
let
  mkTest = pkgs.runCommand "test" { } ''
    echo "Running test with ${pkgs.bun}/bin/bun"
    ${pkgs.bun}/bin/bun run ./test.js
  '';
in
{

}
