#!/usr/bin/env bash
# Smoke test script to verify all services are healthy

set -e

echo "Starting smoke tests..."

# Define an array of existing core services
CORE_SERVICES=(
  "api-gateway:5002"
  "user-service:5004"
  "property-service:5003"
  "form-service:5005"
  "analysis-service:5006"
  "report-service:5007"
)

# Define Apollo Federation Gateway
GATEWAY_SERVICES=(
  "apollo-federation-gateway:4001"
)

# Define external integrated services (not actually running yet)
EXTERNAL_SERVICES=(
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

# Test a service
test_service() {
  local service_name=$1
  local port=$2
  local category=$3
  
  echo "Testing $service_name ($category) on port $port..."
  
  # Try to access the health endpoint
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health || echo "000")
  
  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ $service_name is healthy (HTTP 200)"
    ((SUCCESS_COUNT++))
    return 0
  else
    # For Gateway, try the dedicated health port
    if [[ "$service_name" == "apollo-federation-gateway" ]]; then
      HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/health || echo "000")
      if [[ "$HTTP_STATUS" == "200" ]]; then
        echo "✅ $service_name is healthy on health port (HTTP 200)"
        ((SUCCESS_COUNT++))
        return 0
      fi
    fi
    
    # For non-required external services, just log but don't count as failure
    if [[ "$category" == "external" ]]; then
      echo "⚠️ $service_name is not available (HTTP $HTTP_STATUS) - expected for external services"
      return 0
    else
      echo "❌ $service_name is not healthy (HTTP $HTTP_STATUS)"
      ((FAILURE_COUNT++))
      FAILED_SERVICES+=("$service_name")
      return 1
    fi
  fi
}

# Test core services (expected to be running)
echo "Testing core services..."
for service_info in "${CORE_SERVICES[@]}"; do
  service_name="${service_info%%:*}"
  port="${service_info##*:}"
  test_service "$service_name" "$port" "core"
done

# Test gateway services
echo -e "\nTesting gateway services..."
for service_info in "${GATEWAY_SERVICES[@]}"; do
  service_name="${service_info%%:*}"
  port="${service_info##*:}"
  test_service "$service_name" "$port" "gateway"
done

# Test external services (not expected to be running yet)
echo -e "\nChecking external integrated services status..."
for service_info in "${EXTERNAL_SERVICES[@]}"; do
  service_name="${service_info%%:*}"
  port="${service_info##*:}"
  test_service "$service_name" "$port" "external"
done

# Calculate total services tested
TOTAL_SERVICES=$((${#CORE_SERVICES[@]} + ${#GATEWAY_SERVICES[@]} + ${#EXTERNAL_SERVICES[@]}))

# Display summary
echo ""
echo "========================================"
echo "SMOKE TEST SUMMARY"
echo "========================================"
echo "Total services tested: $TOTAL_SERVICES"
echo "Healthy services: $SUCCESS_COUNT"
echo "Unhealthy core/gateway services: $FAILURE_COUNT"

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