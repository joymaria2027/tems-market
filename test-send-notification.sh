#!/usr/bin/env bash
# ============================================================
# INTEGRATION TEST — send-notification Edge Function
#
# Uses the running Supabase local stack (port 54321) which
# serves edge functions at /functions/v1/<name>.
# If `supabase functions serve` is not already running, it
# starts it first.
# ============================================================

PROJECT_DIR="/home/aixrichlian/Downloads/lovable-project-151b6c0c"
LOG_FILE="/tmp/send-notification-serve.log"
PID_FILE="/tmp/send-notification-serve.pid"

FUNC_URL="http://127.0.0.1:54321/functions/v1/send-notification"
PASS_COUNT=0
FAIL_COUNT=0
FAILURES=""

# ── Colours ────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass()  { PASS_COUNT=$((PASS_COUNT+1)); echo -e "  ${GREEN}✓ PASS${NC}  $1"; }
fail()  { FAIL_COUNT=$((FAIL_COUNT+1)); echo -e "  ${RED}✗ FAIL${NC}  $1"; FAILURES="${FAILURES}\n    ${RED}✗${NC} $1 — $2"; }

check_code() {
  local test_name="$1" expected="$2" code="$3" body="$4"
  if [ "$code" = "$expected" ]; then
    pass "$test_name"
  else
    fail "$test_name" "Expected ${expected}, got ${code}: ${body}"
  fi
}

# ── Ensure function server is running ─────────────────────
cleanup() {
  echo ""
  echo "── Shutting down ──"
  if [ -f "${PID_FILE}" ]; then
    kill "$(cat "${PID_FILE}")" 2>/dev/null || true
    rm -f "${PID_FILE}"
  fi
  pkill -f "supabase functions serve.*send-notification" 2>/dev/null || true
  echo "Done."
}

echo "── Ensuring send-notification is being served ──"
cd "${PROJECT_DIR}"

# Check if function is already available via the API gateway
if curl -sf -o /dev/null "${FUNC_URL}" 2>/dev/null; then
  echo "Function already available at ${FUNC_URL}"
else
  echo "Starting supabase functions serve send-notification..."
  > "${LOG_FILE}"
  supabase functions serve send-notification --no-verify-jwt > "${LOG_FILE}" 2>&1 &
  echo $! > "${PID_FILE}"
  SERVER_PID=$!
  trap cleanup EXIT
  
  # Wait for the log to show the function is served
  echo "Waiting for function server..."
  for i in $(seq 1 60); do
    if grep -q "send-notification" "${LOG_FILE}" 2>/dev/null; then
      echo "Server ready after ${i}s (PID ${SERVER_PID})"
      break
    fi
    if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
      echo "ERROR: Server process died."
      tail -30 "${LOG_FILE}"
      exit 1
    fi
    sleep 1
  done
  
  # Wait a bit more for compilation
  sleep 5
fi

# Verify the function responds
echo "Verifying function at ${FUNC_URL}..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${FUNC_URL}" -H 'Content-Type: application/json' -d '{"phone":"+2201234567","message":"probe","type":"probe"}' 2>/dev/null || echo "000")
echo "Probe response: ${HTTP_CODE}"

echo ""
echo "── Running 8 test scenarios against ${FUNC_URL} ──"
echo ""

# ── Helper to send a request ───────────────────────────────
send_req() {
  local method="$1" data="$2"
  if [ "$method" = "OPTIONS" ]; then
    curl -s -w "\n%{http_code}" -X OPTIONS "${FUNC_URL}" 2>/dev/null || echo "ERROR:7"
  else
    curl -s -w "\n%{http_code}" -X POST "${FUNC_URL}" \
      -H "Content-Type: application/json" \
      -d "${data}" 2>/dev/null || echo "ERROR:7"
  fi
}

# ── Test 1: OPTIONS preflight (CORS) ───────────────────────
echo "Test 1: OPTIONS preflight (CORS)"
RESP=$(send_req "OPTIONS" "")
CODE=$(echo "$RESP" | tail -n 1)
check_code "OPTIONS → ${CODE}" "200" "$CODE" "$(echo "$RESP" | head -n -1)"

# ── Test 2: Missing phone ──────────────────────────────────
echo "Test 2: POST with missing phone"
RESP=$(send_req "POST" '{"message":"Test","type":"invite"}')
BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n 1)
if [ "$CODE" = "400" ] && echo "$BODY" | grep -q "Phone number is required"; then
  pass "Missing phone → 400 + correct error"
else
  fail "Missing phone" "Expected 400 + phone error, got ${CODE}: ${BODY}"
fi

# ── Test 3: Missing message ────────────────────────────────
echo "Test 3: POST with missing message"
RESP=$(send_req "POST" '{"phone":"+2201234567","type":"invite"}')
BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n 1)
if [ "$CODE" = "400" ] && echo "$BODY" | grep -q "Message is required"; then
  pass "Missing message → 400 + correct error"
else
  fail "Missing message" "Expected 400 + message error, got ${CODE}: ${BODY}"
fi

# ── Test 4: Missing type ───────────────────────────────────
echo "Test 4: POST with missing type"
RESP=$(send_req "POST" '{"phone":"+2201234567","message":"Your invite link: https://tems.link/abc"}')
BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n 1)
if [ "$CODE" = "400" ] && echo "$BODY" | grep -q "Notification type is required"; then
  pass "Missing type → 400 + correct error"
else
  fail "Missing type" "Expected 400 + type error, got ${CODE}: ${BODY}"
fi

# ── Test 5: Valid request, no API keys configured ──────────
echo "Test 5: Valid request (no API keys — expect channel unavailable)"
RESP=$(send_req "POST" '{"phone":"+2201234567","message":"Your invite link: https://tems.link/abc","type":"invite"}')
BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n 1)
if [ "$CODE" = "500" ] && echo "$BODY" | grep -q "No notification channel available"; then
  pass "No API keys → 500 + channel unavailable error"
else
  fail "No API keys" "Expected 500 + channel error, got ${CODE}: ${BODY}"
fi

# ── Test 6: Valid request with userId ─────────────────────
echo "Test 6: Valid request with userId (no API keys)"
RESP=$(send_req "POST" '{"phone":"+2201234567","message":"Your invite link: https://tems.link/abc","type":"invite","userId":"00000000-0000-0000-0000-000000000000"}')
BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n 1)
if [ "$CODE" = "500" ] && echo "$BODY" | grep -q "No notification channel available"; then
  pass "With userId → 500 + channel unavailable"
else
  fail "With userId" "Expected 500 + channel error, got ${CODE}: ${BODY}"
fi

# ── Test 7: Invalid JSON body ─────────────────────────────
echo "Test 7: Invalid JSON body"
RESP=$(send_req "POST" "not-json")
BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n 1)
if [ "$CODE" = "500" ]; then
  pass "Invalid JSON → 500 (caught by try/catch)"
else
  fail "Invalid JSON" "Expected 500, got ${CODE}: ${BODY}"
fi

# ── Test 8: Phone normalization (local number without +220) ──
echo "Test 8: Local number without +220"
RESP=$(send_req "POST" '{"phone":"1234567","message":"Test","type":"invite"}')
BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n 1)
if [ "$CODE" = "500" ] && echo "$BODY" | grep -q "No notification channel available"; then
  pass "Local number → 500 (normalized, no channels)"
else
  fail "Local number" "Expected 500 + channel error, got ${CODE}: ${BODY}"
fi

# ── Summary ────────────────────────────────────────────────
echo ""
echo "── Results ──"
echo "  Passed: ${PASS_COUNT}"
echo "  Failed: ${FAIL_COUNT}"
if [ -n "${FAILURES}" ]; then
  echo -e "Failures:${FAILURES}"
fi

# Exit code
[ "${FAIL_COUNT}" -eq 0 ]
