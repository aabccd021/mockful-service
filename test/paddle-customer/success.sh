sqlite3 "$NETERO_STATE/mock.sqlite" <<EOF
INSERT INTO paddle_project (id) VALUES ('mock_project_id');

INSERT INTO paddle_api_key (project_id, key)
  VALUES (
    'mock_project_id', 
    'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
  );
EOF

curl http://localhost:3001/https://sandbox-api.paddle.com/customers \
  --request POST \
  --fail \
  --fail-early \
  --silent \
  --output ./body \
  --header "Authorization: Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO" \
  --header "Content-Type: application/json" \
  --data '{
    "email": "sam@example.com"
  }'

customer_id=$(jq --raw-output '.data.id' ./body)

curl \
  --silent \
  --fail \
  --fail-early \
  --output ./body \
  --write-out "%output{./header.json}%{header_json}" \
  --location \
  --header 'Authorization: Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO' \
  "http://localhost:3001/https://sandbox-api.paddle.com/customers"

cat <<EOF >./expected.json
{
  "data": [
    {
      "id": "$customer_id",
      "email": "sam@example.com"
    }
  ]
}
EOF

json-diff ./body ./expected.json
