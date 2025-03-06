goto --url "http://localhost:3000\
?response_type=code\
&state=%5BfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 400
assert_equal 'Invalid state character: "[". Expected URL-safe character.' "$(cat "$NETERO_DIR/body")"
