#!/bin/bash

# Test script for submit-pilot-request Edge Function
# Run this to test that the Edge Function works correctly

SUPABASE_URL="https://xmedbyzogflxermekejg.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZWRieXpvZ2ZseGVybWVrZWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNjE5MDUsImV4cCI6MjA4MTgzNzkwNX0.aIWHA_IUdO3cUKGCExpC_8I-XUxKg8HGt3EI6CskZ0w"

echo "Testing submit-pilot-request Edge Function..."
echo ""

curl -i --location --request POST "${SUPABASE_URL}/functions/v1/submit-pilot-request" \
  --header "Authorization: Bearer ${ANON_KEY}" \
  --header "Content-Type: application/json" \
  --data '{
    "email": "test@example.com",
    "contact_name": "Test User",
    "company_name": "Test Company AB",
    "org_nr": "123456-7890",
    "description": "This is a test from shell script"
  }'

echo ""
echo ""
echo "Test complete! Check response above."
echo "Expected: HTTP 200 with success: true"

