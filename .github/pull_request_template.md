<!--
  Thanks for contributing to Orvex Monitor!
  Keep the summary focused on the "why". Link related issues with "Closes #123".
-->

## Summary

<!-- What does this change do, and why? -->

## Related issues

<!-- e.g. Closes #123 -->

## Type of change

- [ ] Fix (non-breaking change that fixes an issue)
- [ ] Feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Chore / docs / tooling

## Affected workspaces

- [ ] `apps/frontend`
- [ ] `apps/api`
- [ ] `apps/agent`
- [ ] `packages/*`
- [ ] `supabase/` (migrations / schema)

## Quality gates

Run from the repo root and confirm each passes before requesting review:

- [ ] `pnpm exec prettier --check .`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Database changes

- [ ] No schema changes
- [ ] Adds a migration under `supabase/migrations/` and regenerates types (`pnpm gen:types`)

## Notes for reviewers

<!-- Screenshots, trade-offs, follow-ups, anything worth calling out. -->
