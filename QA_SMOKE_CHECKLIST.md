# Pomotorro QA Smoke Checklist (P0)

Run this checklist on branch `codex/m3-monetization-ready` before merge.

## Test Environment

- URL: `https://pomotorro.co/` (or local dev server)
- Browser: latest Chrome and Safari
- Device sizes:
  - Desktop: >= 1280px wide
  - Mobile: iPhone 12/13 class viewport
- Supabase project: `vdagjbbpxtrjtpldixeg`

## Pass/Fail Matrix

| ID | Area | Scenario | Expected Result | Status |
|---|---|---|---|---|
| 1 | Boot | Load app fresh | Timer renders; no JS crash in console | TODO |
| 2 | Activation | Click `Start Focus` on first use | Timer starts; helper pulse clears | TODO |
| 3 | Timer | Pause and resume | Button text and timer state remain consistent | TODO |
| 4 | Timer | Reset flow | Confirm dialog resets timer; cancel keeps current time | TODO |
| 5 | Tasks | Click task chip (`Inbox zero`) | Input is filled with selected task text | TODO |
| 6 | Tasks | Click `More` then `Less` | Extra chips toggle without layout break | TODO |
| 7 | Retention | Complete one focus session | Sessions/streak UI updates and completion feedback appears | TODO |
| 8 | Auth | Open login modal | Modal opens/close cleanly | TODO |
| 9 | Auth | Create account with valid email/password | Account creation succeeds or requests email confirmation | TODO |
| 10 | Auth | Log in with confirmed account | Session starts; `Log In` becomes `Log Out` | TODO |
| 11 | Support CTA | Click `Support Pomotorro` | Stripe checkout page opens | TODO |
| 12 | Support Return | Complete payment in test mode | Redirect to `?checkout=success`, thank-you notice shown | TODO |
| 13 | Support Return | Cancel checkout | Redirect to `?checkout=cancel`, cancellation notice shown | TODO |
| 14 | Mobile UI | Scroll and interaction on mobile | No overlap/clipping in primary timer, action bar, support card | TODO |
| 15 | Analytics | Trigger key actions | `window.__pomotorroEventLog` receives events | TODO |

## Quick Event Verification

Open browser console and run:

```js
window.__pomotorroEventLog
```

Confirm recent events include actions you just executed (for example: `focus_started`, `auth_login_attempt`, `support_checkout_click`).
