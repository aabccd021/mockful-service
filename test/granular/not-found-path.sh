#!/bin/bash
set -euo pipefail

response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:3001/non-existent-path")

if [ "$response" != "404" ]; then
  echo "Expected 404 status code, got: $response"
  exit 1
fi
