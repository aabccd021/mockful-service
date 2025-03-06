goto --url "http://localhost:3000\
?response_type=token\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_challenge=G5k-xbS5eqMAekQELZ07AhN64LQxBuB4wVG7wryu5b8\
&code_challenge_method=S256\
&code_verifier=AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 400
