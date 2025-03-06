goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 400
assert_equal 'Parameter scope is required.' "$(cat "$NETERO_DIR/body")"
