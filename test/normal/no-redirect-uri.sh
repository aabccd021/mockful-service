goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&scope=openid\
&client_id=mock_client_id\
"

assert_response_code_equal 200

printf "mysub" >id_token_sub.txt
submit "//form" --data "id_token_sub=id_token_sub.txt"

assert_response_code_equal 400
assert_equal 'Parameter redirect_uri is required.' "$(cat "$NETERO_STATE/browser/1/tab/1/body")"
