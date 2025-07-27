goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&code_challenge=G5k-xbS5eqMAekQELZ07AhN64LQxBuB4wVG7wryu5b8\
&code_challenge_method=S256\
&code_verifier=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert-response-code-equal 200

submit "//form" --submit-button "//form/button[@value='kita-sub']"

assert-response-code-equal 400
assert-equal 'Code verifier does not match code challenge.' "$(cat "$NETERO_STATE/browser/1/tab/1/body")"
