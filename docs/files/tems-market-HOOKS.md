# Tems Market — Hooks

## pre-commit (TypeScript check)
Runs before every commit. Blocks commit if types fail.
```bash
bunx tsc --noEmit
```
Why a hook not CLAUDE.md: hooks enforce deterministically. CLAUDE.md is just a suggestion.

## post-migration (Supabase type generation)
Runs after any change to supabase/migrations/.
```bash
bunx supabase gen types typescript --local > types/supabase.ts
```
Why a hook: regenerating types is mechanical, not a judgment call. 
Forgetting it causes type errors that waste debug time.

## pre-push (full test suite)
Runs before any git push.
```bash
bunx tsc --noEmit && bunx jest --coverage
```

## Setup in .claude/settings.json
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo '$CLAUDE_TOOL_INPUT' | grep -q 'npx tsc'; then echo 'Use bunx tsc --noEmit not npx tsc'; exit 1; fi"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo '$CLAUDE_TOOL_INPUT' | grep -q 'supabase db push\\|supabase db reset'; then bunx supabase gen types typescript --local > types/supabase.ts; fi"
          }
        ]
      }
    ]
  }
}
```
