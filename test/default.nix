{ pkgs }:
let

  mkServer = src: pkgs.runCommandLocal "server" { } ''
    ${pkgs.bun}/bin/bun build ${src} \
      --compile \
      --minify \
      --bytecode \
      --sourcemap \
      --outfile server
    mkdir -p $out/bin
    mv server $out/bin/server
  '';

  normalServer = mkServer ./normal_server.ts;
  granularServer = mkServer ./granular_server.ts;

  mkTest = prefix: server: dir: name: pkgs.runCommandLocal "${prefix}${name}"
    {
      env.TEST_FILE = "${dir}/${name}.sh";
      buildInputs = [
        pkgs.jq
        pkgs.netero-test
        pkgs.netero-oauth-mock
        pkgs.jwt-cli
        pkgs.curl
        pkgs.tinyxxd
        server
      ];
    }
    (builtins.readFile ./test.sh);


  mapTests = prefix: server: dir: names: builtins.listToAttrs (builtins.map
    (name: {
      name = prefix + name;
      value = mkTest prefix server dir name;
    })
    names);

  normalTests = mapTests "test-google-normal-" normalServer ./normal [
    "empty-scope-no-idtoken"
    "no-client-id"
    "no-redirect-uri"
    "no-scope"
    "response-type-token"
    "success"
    "success-s256"
    "success-plain"
    "success-no-challenge-method"
    "s256-mismatch"
  ];

  granularTests = mapTests "test-google-granular-" granularServer ./granular [
    "auth-not-basic"
    "auth-session-not-found"
    "callback-url-mismatch"
    "client-id-mismatch"
    "client-secret-mismatch"
    "invalid-grant-type"
    "no-code"
    "no-code-verifier"
    "no-credentials"
    "no-grant-type"
    "no-auth-header"
    "not-found-path"
    "success"
    "success-s256"
    "get"
  ];

in
normalTests // granularTests // {
  normalServer = normalServer;
  granularServer = granularServer;
}
