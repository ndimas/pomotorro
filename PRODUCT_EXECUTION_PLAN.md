# Pomotorro Product Execution Plan (Production Track)

Status: Proposed for approval  
Owner: Nick + Codex  
Working branch: `codex/m3-monetization-ready`  
Merge policy: one deliverable branch -> approved -> merge to `main`

## 1) Goal

Build a lovable focus product that improves:
- attention (users start a session faster, complete more sessions)
- retention (users come back daily/weekly)
- revenue (paid plan has real delivered value)

## 2) Non-Negotiables

1. Do not sell features that do not exist.
2. Every paid action must produce a recorded entitlement state.
3. Core timer flow stays fast and uncluttered.
4. Every milestone ships with a test checklist.
5. No direct use of secret keys in frontend code.

## 3) Success Metrics (track weekly)

- Activation: first session started within 90 seconds of first visit.
- Engagement: average completed sessions per active day.
- Retention: D1 and D7 return rate.
- Monetization: checkout completion rate and refund rate.
- Reliability: auth failure rate and payment-entitlement mismatch count.

## 4) Branch Roadmap (Discrete Deliverables)

## P0 - Baseline, Tracking, and QA Guardrails
- Branch: `codex/p0-baseline-qa`
- Deliverable:
  - event map for activation/retention/checkout
  - local smoke test script/checklist
  - remove temporary/debug UI from production surface
- Acceptance:
  - we can measure start, complete, login/signup, upgrade-click, checkout-success
  - documented manual QA runbook exists in repo

## P1 - Core Timer UX Simplification (Playful + Focused)
- Branch: `codex/p1-core-ux`
- Deliverable:
  - simplify main screen hierarchy (less overload)
  - keep mascot warmth and personality
  - mobile + desktop spacing/typography polish
- Acceptance:
  - primary CTA remains dominant
  - no UI clipping/overlap on common mobile sizes
  - task chips fill input consistently

## P2 - Auth Reliability and Account Creation Hardening
- Branch: `codex/p2-auth-hardening`
- Deliverable:
  - reliable signup/login/logout flows
  - clear errors for DNS/network/email-confirmation cases
  - tested profile + session sync behavior
- Acceptance:
  - signup and login succeed in browser against live Supabase project
  - known failures show actionable messages (not generic "Failed to fetch")
  - no duplicate script initialization issues

## P3 - Real Pro Features v1 (No Placeholder Copy)
- Branch: `codex/p3-pro-features-v1`
- Deliverable:
  - advanced focus analytics panel (weekly totals, streak quality, completion trends)
  - custom themes pack (at least 3) and sound pack selector
  - cloud history + streak backup as explicit Pro capability
- Acceptance:
  - each Pro item in UI corresponds to shipped functionality
  - free vs pro boundaries are clear and honest
  - no broken/empty Pro screens

## P4 - Billing + Entitlements (Stripe + Supabase)
- Branch: `codex/p4-billing-entitlements`
- Deliverable:
  - Stripe checkout wired to real entitlement updates
  - webhook handler (recommended via Supabase Edge Function)
  - `profiles` (or dedicated table) stores `pro_status`, period, Stripe IDs
- Acceptance:
  - successful payment updates user entitlement automatically
  - canceled/expired payment removes entitlement correctly
  - purchase events are auditable (who paid, when, status)

## P5 - Conversion and Retention Iteration
- Branch: `codex/p5-conversion-retention`
- Deliverable:
  - upgrade surface redesign based on shipped Pro value
  - onboarding nudges that improve session starts and returns
  - lightweight experiment flags (copy/layout variants)
- Acceptance:
  - checkout CTA is contextual, not spammy
  - retention nudges feel supportive, not noisy
  - event data supports comparison of variants

## P6 - Launch Hardening and Release Prep
- Branch: `codex/p6-launch-hardening`
- Deliverable:
  - regression checklist passed
  - docs for operations (billing incidents, auth incidents, rollbacks)
  - finalize production env configuration
- Acceptance:
  - critical flows pass: timer, task flow, auth, checkout, entitlement
  - deployment branch behavior is verified (`main` vs `master`)
  - ready-to-ship checklist signed off

## 5) Technical Decisions (Explicit)

1. Checkout-only with frontend is acceptable for initial payment page routing.
2. Entitlements require server-side verification/webhooks; frontend-only checks are not enough for paid access control.
3. Stripe secret keys remain server-side only (Edge Function/env vars).
4. Publishable key may live in frontend.

## 6) Immediate Next Checkpoint (what I should execute now)

If approved, I will start with `P0` immediately and deliver:
1. event instrumentation map + implementation
2. QA checklist file with pass/fail matrix
3. cleanup of any remaining preview-only copy/logic that conflicts with production intent

