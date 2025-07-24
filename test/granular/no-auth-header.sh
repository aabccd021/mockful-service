goto --url "http://localhost:3000\
?response_type=code\
&state=sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4\
&scope=openid\
&client_id=mock_client_id\
&redirect_uri=http://localhost:3000/login-callback\
"

assert-response-code-equal 200

submit "//form" --submit-button "//form/button[@value='kita']"

assert-response-code-equal 200

code=$(cat ./code.txt)

curl_options=" \
  --cookie '$NETERO_STATE/browser/1/cookie.txt' \
  --cookie-jar '$NETERO_STATE/browser/1/cookie.txt' \
  --output '$NETERO_STATE/browser/1/tab/1/body' \
  --write-out \"%output{$NETERO_STATE/browser/1/tab/1/url.txt}%{url_effective}%output{./header.json}%{header_json}%output{$NETERO_STATE/browser/1/tab/1/response.json}%{json}\" \
  --compressed \
  --show-error \
  --silent \
  --location \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=$code' \
  --data-urlencode 'redirect_uri=http://localhost:3000/login-callback' \
"

eval "curl $curl_options 'http://localhost:3001/https://oauth2.googleapis.com/token'"

assert-response-code-equal 400
assert-equal 'Authorization header is required.' "$(cat "$NETERO_STATE/browser/1/tab/1/body")"
