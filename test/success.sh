goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_challenge=G5k-xbS5eqMAekQELZ07AhN64LQxBuB4wVG7wryu5b8\
&code_challenge_method=S256\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 200

printf "mysub" >google_auth_id_token_sub.txt
submit "//form" --data "google_auth_id_token_sub=google_auth_id_token_sub.txt"

assert_response_code_equal 200

sub=$(jq -r ".id_token" "$NETERO_DIR/body" | jwt decode --json - | jq -r ".payload.sub")
assert_equal "mysub" "$sub"
