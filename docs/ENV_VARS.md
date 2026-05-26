# Environment Variables — Tems Market

All environment variables required for the Supabase Edge Functions to operate.

## Automatically Provided by Supabase

These are injected by Supabase into every Edge Function. You do **not** need to set them manually.

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key (safe for client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin-level; never expose to client) |

---

## `send-notification` Edge Function

Sends notifications via WhatsApp (preferred) with SMS fallback. At least **one channel** must be configured.

### WhatsApp — Meta Cloud API

| Variable | Required | Description |
|----------|----------|-------------|
| `META_WHATSAPP_ACCESS_TOKEN` | No* | Permanent access token from Meta Business Manager |
| `META_WHATSAPP_PHONE_NUMBER_ID` | No* | Phone Number ID from Meta WhatsApp Business API |

**Setup:**
1. Go to [Meta for Developers](https://developers.facebook.com/) → Your App → WhatsApp → API Setup
2. Generate a permanent access token (System User → Generate Token → whatsapp_business_messaging)
3. Copy the **Phone Number ID** from the "From" phone number section

### SMS — Africa's Talking

| Variable | Required | Description |
|----------|----------|-------------|
| `AFRICA_TALKING_API_KEY` | No* | API key from Africa's Talking dashboard |
| `AFRICA_TALKING_USERNAME` | No* | Your Africa's Talking application username |

**Setup:**
1. Create an account at [Africa's Talking](https://africastalking.com/)
2. Go to Dashboard → Settings → API Key
3. For production, register a sender ID (shortcode) for The Gambia (+220)

> **\*Note:** At least one channel (WhatsApp _or_ SMS) must be configured. If both are configured, WhatsApp is tried first; SMS is used as fallback.

---

## `complete-vendor-invite` Edge Function

Uses only the auto-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. No additional env vars needed.

## `update-password` Edge Function

Uses only the auto-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. No additional env vars needed.

---

## Setting Secrets in Supabase

Use the Supabase CLI to set secrets for your Edge Functions:

```bash
# WhatsApp
supabase secrets set META_WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxxxxxxxx"
supabase secrets set META_WHATSAPP_PHONE_NUMBER_ID="123456789012345"

# SMS
supabase secrets set AFRICA_TALKING_API_KEY="atsk_xxxxxxxxxxxxxxxx"
supabase secrets set AFRICA_TALKING_USERNAME="tems-market"
```

To verify secrets are set:

```bash
supabase secrets list
```

---

## Local Development

For local development with `supabase functions serve`, create a `.env.local` file at the project root:

```env
META_WHATSAPP_ACCESS_TOKEN=your-test-token
META_WHATSAPP_PHONE_NUMBER_ID=your-test-phone-id
AFRICA_TALKING_API_KEY=your-sandbox-key
AFRICA_TALKING_USERNAME=sandbox
```

Then run:

```bash
supabase functions serve --env-file .env.local
```

> **Important:** Never commit `.env.local` to version control. It is already in `.gitignore`.
