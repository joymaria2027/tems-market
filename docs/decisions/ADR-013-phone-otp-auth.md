# ADR-013: Phone OTP Authentication via Supabase Auth + Edge Function Wrappers

## Status
Accepted

## Date
2026-05-26

## Context
Tems Market targets The Gambia where phone-based auth is more accessible than email. Users may not have reliable email access, but mobile phones are ubiquitous. The auth system needs to:

- Authenticate users via phone number + OTP (SMS code)
- Avoid storing or managing OTP codes ourselves (security risk)
- Work with Supabase Auth as the identity provider
- Support the 5-role system (customer, affiliate, vendor, admin, superadmin)
- Work in local dev (OTP logged to console) and production (Twilio SMS)
- Ensure `public.users` records exist after auth (for RLS policies, profile queries)

## Decision
Use **Supabase Auth's built-in phone OTP** (`signInWithOtp` / `verifyOtp`) wrapped in Edge Functions for server-side validation and side-effects.

### Flow
1. Client calls `supabase.functions.invoke("request-otp", { body: { phone } })`  
   → Edge Function normalizes phone to E.164 format, calls `supabase.auth.signInWithOtp({ phone })`  
   → Supabase Auth sends SMS (or logs to console in local dev)
2. Client calls `supabase.functions.invoke("verify-otp", { body: { phone, code } })`  
   → Edge Function normalizes phone, calls `supabase.auth.verifyOtp({ phone, token: code, type: "sms" })`  
   → Returns session to client
3. Client calls `supabase.auth.setSession(session)` with returned tokens  
   → `onAuthStateChange` fires → profile fetched from `public.users`

### Key design properties
- **Edge Functions use anon key** — OTP endpoints are public by nature
- **Edge Functions set `autoRefreshToken: false, persistSession: false`** — no server-side session persistence
- **Failsafe user record creation** — if the DB trigger (`handle_new_auth_user`) misses or races, verify-otp creates the `public.users` row using service_role key
- **Phone normalized to E.164** — strips non-digit chars, ensures `+` prefix (Supabase Auth requirement)
- **All validation happens on the Edge Function** — not the client

## Alternatives Considered

### Direct client-side Supabase Auth calls
- Pros: Simpler, fewer moving parts, no Edge Functions needed
- Cons: No server-side logging, no failsafe user record creation, harder to add future logic (rate limiting, analytics)
- Rejected: Edge Function wrapper adds negligible latency and gives us a hook for future requirements

### Custom OTP generation (own `otp_codes` table)
- Pros: Full control over OTP lifecycle
- Cons: Must handle rate limiting, expiry, SMS delivery, hashing ourselves. Introduces security surface area for no benefit.
- Rejected: Supabase Auth already handles all of this securely via GoTrue

### Email-only auth
- Pros: No SMS costs, no phone formatting issues
- Cons: Poor fit for The Gambian market where phone access is more universal than email
- Rejected: Doesn't meet product requirements

## Consequences
- No custom `otp_codes` table needed — Supabase Auth manages OTP lifecycle
- Edge Functions must have `verify_jwt = false` (public endpoints)
- Client must call `supabase.auth.setSession()` after OTP verification — the session isn't set automatically
- SMS delivery in production requires Supabase Auth SMS provider config (Twilio or equivalent)
- In local dev, OTP codes are printed to the Supabase console — testable without a real phone
