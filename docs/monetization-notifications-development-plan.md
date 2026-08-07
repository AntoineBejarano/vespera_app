# Monetization and Notifications Development Plan

## Goal

Guide users toward payment at high-intent moments without breaking trust:

1. Let Starter users reach real value.
2. Detect limits and premium actions centrally.
3. Return a structured paywall payload, not a plain error.
4. Attribute checkout to the triggering feature.
5. Record lifecycle events and notification deliveries for dedupe and later automation.

## Current MVP

- Starter stays useful:
  - 1 persona
  - daily message allowance
  - 1 knowledge pack
- Creator removes daily chat friction and supports production channels.
- Studio unlocks roster and deeper knowledge workflows.
- Apex SFW billing uses Stripe only.
- After Dark remains excluded from Stripe.

## Implemented Touchpoints

- Daily chat limit -> Creator paywall.
- Persona limit on create/import/fork -> Studio paywall.
- Knowledge pack limit -> Studio paywall.
- Settings upgrade -> checkout attribution.
- Checkout sessions -> persisted `CheckoutIntent`.
- Stripe webhook completion/expiry -> intent status updates.
- Signup/persona lifecycle -> deduped email dispatcher.

## Data Layer

- `ProductEvent`: persisted funnel event stream.
- `CheckoutIntent`: Stripe session attribution and abandoned-checkout base.
- `NotificationPreference`: user-level notification preferences.
- `NotificationDelivery`: dedupe/status ledger for lifecycle notifications.

## Next Phase

1. Add a cron route for `CheckoutIntent.status = started` older than 2-4 hours.
2. Add `checkout_abandoned` and `limit_reached` email templates.
3. Add an operator funnel dashboard backed by `ProductEvent`.
4. Add per-feature entitlements for Telegram/API production usage.
5. A/B test paywall copy and Starter limits.
