# Pomotorro Event Tracking Map (P0)

## Instrumentation Targets

- `plausible` (if loaded)
- `umami.track` (if loaded)
- `sa_event` (SimpleAnalytics, if loaded)
- local in-browser debug log: `window.__pomotorroEventLog`

## Event Catalog

| Event | Trigger | Properties |
|---|---|---|
| `app_loaded` | App initialized on `DOMContentLoaded` | `file_origin`, `viewport`, `path`, `session_id` |
| `activation_completed` | User starts first timer session | `path`, `session_id` |
| `focus_started` | Timer starts from fresh state | `focus_minutes`, `has_task`, `path`, `session_id` |
| `focus_resumed` | Timer resumes after pause | `focus_minutes`, `has_task`, `path`, `session_id` |
| `focus_paused` | User pauses timer | `remaining_seconds`, `path`, `session_id` |
| `focus_completed` | Focus timer reaches zero | `points_earned`, `had_task`, `sessions_today`, `streak_days`, `path`, `session_id` |
| `focus_reset_confirmed` | User confirms reset dialog | `path`, `session_id` |
| `focus_reset_canceled` | User cancels reset dialog | `path`, `session_id` |
| `settings_saved` | Settings modal save action | `focus_duration`, `short_break`, `long_break`, `auto_start_breaks`, `sound_enabled`, `path`, `session_id` |
| `task_chip_selected` | Quick task chip click | `label`, `path`, `session_id` |
| `task_chip_toggle_more` | Quick task "More/Less" click | `expanded`, `path`, `session_id` |
| `auth_disabled_file_origin` | App loaded on `file://` auth-disabled mode | `path`, `session_id` |
| `auth_modal_opened` | Login modal opened | `path`, `session_id` |
| `auth_login_attempt` | Login submit click with credentials | `path`, `session_id` |
| `auth_login_success` | Login completes successfully | `path`, `session_id` |
| `auth_login_failed` | Login fails | `category`, `path`, `session_id` |
| `auth_login_validation_error` | Login blocked client-side | `reason`, `path`, `session_id` |
| `auth_signup_attempt` | Signup submit click with credentials | `path`, `session_id` |
| `auth_signup_success` | Signup success | `mode`, `path`, `session_id` |
| `auth_signup_failed` | Signup failure | `category`, `path`, `session_id` |
| `auth_signup_validation_error` | Signup blocked client-side | `reason`, `path`, `session_id` |
| `auth_signup_existing_account_logged_in` | Existing account fallback signed in | `path`, `session_id` |
| `auth_signup_existing_account_unconfirmed` | Existing account needs confirmation | `path`, `session_id` |
| `auth_logout` | Logout completed | `path`, `session_id` |
| `auth_session_active` | Session became authenticated | `path`, `session_id` |
| `auth_session_inactive` | Session became unauthenticated | `path`, `session_id` |
| `support_card_rendered` | Support card visible state evaluated | `dismissed`, `path`, `session_id` |
| `support_card_dismissed` | User hides support card | `path`, `session_id` |
| `support_checkout_click` | Support CTA clicked | `path`, `session_id` |
| `support_checkout_opened` | Checkout route opened | `mode`, `path`, `session_id` |
| `support_checkout_success` | Redirect returned with `?checkout=success` | `path`, `session_id` |
| `support_checkout_canceled` | Redirect returned with `?checkout=cancel` | `path`, `session_id` |
| `support_checkout_failed` | Checkout launch failed | `category`, `path`, `session_id` |

## Notes

- No email addresses or password fields are tracked.
- Error messages are mapped to categories before tracking.
- Event payloads are trimmed and sanitized for stability.
