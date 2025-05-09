goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_challenge=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 200

printf "mysub" >id_token_sub.txt
submit "//form" --data "id_token_sub=id_token_sub.txt"

assert_response_code_equal 200

sub=$(
  jq -r ".id_token" "$NETERO_STATE/browser/1/tab/1/body" |
    jwt decode --json - |
    jq -r ".payload.sub"
)
assert_equal "mysub" "$sub"
