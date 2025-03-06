goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert_response_code_equal 200

printf "mysub" >id_token_sub.txt
submit "//form" --data "id_token_sub=id_token_sub.txt"

assert_response_code_equal 200

auth_header=$(echo -n "mock_client_id:mock_client_secret" | base64)
code=$(cat ./code.txt)

curl_options=" \
  --cookie '$NETERO_DIR/cookie.txt' \
  --cookie-jar '$NETERO_DIR/cookie.txt' \
  --output '$NETERO_DIR/body' \
  --write-out \"%output{$NETERO_DIR/url.txt}%{url_effective}%output{./header.json}%{header_json}%output{$NETERO_DIR/response.json}%{json}\" \
  --compressed \
  --show-error \
  --silent \
  --location \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header 'Authorization: Basic $auth_header' \
  --data-urlencode 'grant_type=foo' \
  --data-urlencode 'code=$code' \
  --data-urlencode 'redirect_uri=http://localhost:3000/login-callback' \
"

eval "curl $curl_options 'http://localhost:3001/https://oauth2.googleapis.com/token'"

assert_response_code_equal 400
assert_equal 'Invalid grant_type: "foo". Expected "authorization_code".' "$(cat "$NETERO_DIR/body")"
