goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&scope=openid%20email\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 200

printf "mysub" >id_token_sub.txt
printf "foo@example.com" >email.txt
printf "true" >email_verified.txt
submit "//form" \
  --data "id_token_sub=id_token_sub.txt" \
  --data "email=email.txt" \
  --data "email_verified=email_verified.txt"

assert_response_code_equal 200

payload=$(
  jq -r ".id_token" "$NETERO_STATE/browser/1/tab/1/body" |
    jwt decode --json - |
    jq -r ".payload"
)

sub=$(echo "$payload" | jq -r ".sub")
assert_equal "mysub" "$sub"

email=$(echo "$payload" | jq -r ".email")
assert_equal "foo@example.com" "$email"

email_verified=$(echo "$payload" | jq -r ".email_verified")
assert_equal "true" "$email_verified"
