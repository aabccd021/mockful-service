goto --url "http://localhost:3000\
?response_type=token\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 400

assert_equal 'Invalid response_type: "token". Expected "code".' "$(cat "$NETERO_STATE/browser/1/tab/1/body")"
