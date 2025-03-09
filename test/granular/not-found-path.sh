#!/bin/bash
set -euo pipefail

NON_EXISTENT_PATH="https://invalid-endpoint-path"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:3001/non-existent-path")

if [ "$RESPONSE" != "404" ]; then
  echo "Expected 404 status code, got: $RESPONSE"
  exit 1
fi
