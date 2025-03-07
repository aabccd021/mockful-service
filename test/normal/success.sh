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

payload=$(
  jq -r ".id_token" "$NETERO_DIR/body" |
    jwt decode --json - |
    jq -r ".payload"
)

sub=$(echo "$payload" | jq -r ".sub")
assert_equal "mysub" "$sub"

now=$(date +%s)

exp=$(echo "$payload" | jq -r ".exp")
exp_diff=$((exp - now))
if [ "$exp_diff" -ne 3600 ]; then
  echo "exp is not 1 hour from now: $exp_diff"
  exit 1
fi

iat=$(echo "$payload" | jq -r ".iat")
if [ "$iat" -ne "$now" ]; then
  echo "iat is not now: $iat"
  exit 1
fi
