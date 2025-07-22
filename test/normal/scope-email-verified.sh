goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&scope=openid%20email\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 200

submit "//form" --submit-button "//form/button[@value='yamada']"

assert_response_code_equal 200

payload=$(
  jq -r ".id_token" "$NETERO_STATE/browser/1/tab/1/body" |
    jwt decode --json - |
    jq -r ".payload"
)

sub=$(echo "$payload" | jq -r ".sub")
assert_equal "yamada-sub" "$sub"

email=$(echo "$payload" | jq -r ".email")
assert_equal "yamada@example.com" "$email"

email_verified=$(echo "$payload" | jq -r ".email_verified")
assert_equal "false" "$email_verified"
