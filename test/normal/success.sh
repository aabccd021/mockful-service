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
if [ "$exp_diff" -gt 3650 ] && [ "$exp_diff" -lt 3590 ]; then
  echo "exp is not around 1 hour: $exp_diff"
  exit 1
fi

iat=$(echo "$payload" | jq -r ".iat")
iat_diff=$((now - iat))
if [ "$iat_diff" -gt 10 ] && [ "$iat_diff" -lt 0 ]; then
  echo "iat is not around 0: $iat_diff"
  exit 1
fi
