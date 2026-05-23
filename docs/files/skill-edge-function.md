# Skill: Edge Function Pattern

Invoke this when writing any Supabase Edge Function.

## Template

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  // 1. Auth check (skip only for public endpoints like send-otp)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  // 2. For writes that bypass RLS: use service role client
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 3. Parse + validate input
  const body = await req.json()

  // 4. Business logic here

  // 5. Return
  return json({ success: true })
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

## Rules
- Public endpoints (send-otp, modempay-webhook): skip user auth check, still verify their own token
- Writes to commission_ledger, orders, gift_cards, featured_listings: always use service role client
- All errors return JSON — never let unhandled errors bubble up as non-200 (ModemPay will retry)
- Wrap entire handler body in try/catch for webhook functions
- Log errors to console — Sentry picks them up automatically
