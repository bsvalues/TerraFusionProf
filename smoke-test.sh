#!/usr/bin/env bash
# Smoke test script to verify all services are healthy

set -e

echo "Starting smoke tests..."

# Define an array of services to test
SERVICES=(
  "core-gateway:4000"
  "terrafusionsync:3001" 
  "terrafusionpro:3002" 
  "terraflow:3003" 
  "terraminer:3004" 
  "terraagent:3005"
  "terraf:3006" 
  "terralegislativepulsepub:3007" 
  "bcbscostapp:3008" 
  "bcbsgeoassessmentpro:3009"
  "bcbslevy:3010" 
  "bcbswebhub:3011" 
  "bcbsdataengine:3012" 
  "bcbspacsmapping:3013"
  "geoassessmentpro:3014" 
  "bsbcmaster:3015" 
  "bsincomevaluation:3016" 
  "terrafusion_mock-up:3017"
)

# Track successes and failures
SUCCESS_COUNT=0
FAILURE_COUNT=0
FAILED_SERVICES=()

# Test each service
for service_info in "${SERVICES[@]}"; do
  # Split service info into name and port
  service_name="${service_info%%:*}"
  port="${service_info##*:}"
  
  echo "Testing $service_name on port $port..."
  
  # Try to access the health endpoint
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health || echo "000")
  
  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ $service_name is healthy (HTTP 200)"
    ((SUCCESS_COUNT++))
  else
    echo "❌ $service_name is not healthy (HTTP $HTTP_STATUS)"
    ((FAILURE_COUNT++))
    FAILED_SERVICES+=("$service_name")
  fi
done

# Display summary
echo ""
echo "========================================"
echo "SMOKE TEST SUMMARY"
echo "========================================"
echo "Total services tested: ${#SERVICES[@]}"
echo "Healthy services: $SUCCESS_COUNT"
echo "Unhealthy services: $FAILURE_COUNT"

if [ $FAILURE_COUNT -gt 0 ]; then
  echo ""
  echo "Failed services:"
  for service in "${FAILED_SERVICES[@]}"; do
    echo "- $service"
  done
  echo ""
  echo "❌ Smoke tests FAILED"
  exit 1
else
  echo ""
  echo "✅ ALL SERVICES HEALTHY"
  exit 0
fi