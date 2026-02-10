# Pomotorro UI/UX Delivery Plan

Status: Proposed (awaiting approval)
Owner: Codex + Nick
Branch strategy: one key deliverable per branch, then merge to `main`

## Delivery Rules

1. One branch = one key deliverable.
2. Each branch has clear acceptance criteria.
3. Merge to `main` only after your approval.
4. Keep commits small and reversible.
5. Use branch names with `codex/` prefix.

## Creative Direction Guardrails

1. Keep the improved layout clarity (clear hierarchy, less clutter).
2. Preserve original spirit: warm, playful, mascot-forward.
3. Avoid sterile SaaS look: use soft glow, rounded shapes, and friendly copy.
4. Keep Pomotorro character visible in meaningful places (timer center, auth moments, celebrations).
5. Every milestone must improve both usability and emotional tone, not one at the expense of the other.

## Milestones

### M1 - Activation UX (start first session fast)
- Branch: `codex/m1-activation-ux`
- Deliverable: clearer first-run flow that drives user to press Start within 60 seconds.
- Scope:
  - Stronger primary CTA hierarchy.
  - Starter task prompts (quick chips or prefill hints).
  - First-time helper text near timer/task.
  - Keep playful warm visuals in the hero timer area.
- Acceptance:
  - Main action is visually dominant.
  - New user path is obvious without instructions.
  - Page still feels like Pomotorro (not generic productivity app).
  - No auth regressions.

### M2 - Retention Loop (daily return behavior)
- Branch: `codex/m2-retention-loop`
- Deliverable: lightweight habit system visible on main screen.
- Scope:
  - Daily goal progress (sessions done / target).
  - Streak indicator.
  - Session-complete feedback (micro celebration + next step CTA).
- Acceptance:
  - Goal + streak are visible without clutter.
  - Completion flow nudges next action.
  - Reward moments feel fun and brand-consistent.
  - Works on desktop and mobile.

### M3 - Monetization Readiness (soft value framing)
- Branch: `codex/m3-monetization-ready`
- Deliverable: non-blocking premium framing points in UI.
- Scope:
  - “Pro” teaser in settings or dashboard.
  - Locked preview for advanced insights/themes/sync.
  - Upgrade CTA placement without interrupting core timer.
- Acceptance:
  - Core free flow remains smooth.
  - Premium value is understandable in <10 seconds.
  - No hard paywall introduced yet.

### M4 - Auth + Trust Polish (conversion confidence)
- Branch: `codex/m4-auth-trust-polish`
- Deliverable: login/signup modal refinement with trust cues.
- Scope:
  - Cleaner auth layout and copy.
  - Better loading/error states.
  - Visual consistency with warm brand theme.
- Acceptance:
  - Auth feels intentional and credible.
  - Signup/login states are clear and responsive.
  - Existing login/create logic remains functional.

## Merge Workflow Per Milestone

1. Implement on milestone branch.
2. Share preview summary + changed files.
3. Your approval checkpoint.
4. Merge into `main`:
   - `git checkout main`
   - `git merge --no-ff <milestone-branch>`
   - `git push origin main`

## Notes

- If `main` history needs rewrite for any reason, use `--force-with-lease` only.
- If priorities change, we can reorder milestones without losing branch isolation.
