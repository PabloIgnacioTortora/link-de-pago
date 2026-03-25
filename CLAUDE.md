# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build (runs TypeScript check)
npm run start     # Start production server
npm run lint      # ESLint
```

There are no tests configured.

## Architecture

**LinkPago** is a multi-tenant payment link platform built on Next.js App Router. Merchants create shareable payment links; customers pay via MercadoPago Bricks (card) or bank transfer.

### Request flow for a payment

1. Public page `src/app/pay/[slug]/page.tsx` — server component, fetches `PaymentLink` + `User` (merchant) from MongoDB, passes `brandColor`, `hasCard`, `transfer` props to `<PaymentOptions>`.
2. `<PaymentOptions>` (client) — chooses between card, transfer, or a method selector. Card flow delegates to `<CardBricks>`.
3. `<CardBricks>` — calls `/api/payment/bricks` to get a `preferenceId` + `publicKey`, then calls `initMercadoPago(publicKey)` and renders `<Payment>` from `@mercadopago/sdk-react`. On submit calls `/api/payment/process` with `formData`.
4. `/api/payment/process` — calls MP `payment.create()` with the merchant's decrypted access token. On approval redirects to `/pay/[slug]/success`.

### Auth

NextAuth v5 (beta) configured in `src/auth.ts` + `src/lib/auth/authOptions.ts`. Two providers: Google OAuth and credentials (email+bcrypt). Session strategy is JWT. The session includes `user.id`, `user.plan`, and `user.emailVerified`. All dashboard routes assume authenticated session — there is **no middleware.ts**; route protection is done per-page with `auth()` or `useSession()`.

### Data layer

MongoDB via Mongoose. Connection is cached in a global singleton (`src/lib/db/mongoose.ts`). Models: `User`, `PaymentLink`, `Transaction`, `EmailVerificationToken`, `PasswordResetToken`.

### Sensitive data

Merchant MP access tokens are stored **encrypted** (AES-256-GCM) in `User.mpAccessToken`. Always use `encrypt()`/`decrypt()` from `src/lib/crypto.ts` when reading or writing this field. The `mpPublicKey` is derived from the access token via the MP API (`/users/me`) and stored in plain text — it is not sensitive.

### Plans

Defined in `src/lib/plans.ts`. Two tiers: `free` (max 2 active links, no branding/QR/stats) and `pro`. Plan is stored on `User.plan` with optional `User.planExpiresAt`. Use `canUseFeature(plan, feature)` and `isPro(plan)` helpers. Plan expiry is checked by the cron route `/api/cron/plan-check` (requires `Authorization: Bearer CRON_SECRET`).

### API conventions

- All mutating API routes call `checkOrigin(req)` from `src/lib/csrf.ts` as CSRF protection.
- Rate limiting via `isRateLimited()` from `src/lib/rateLimit.ts` (Redis-free, in-memory).
- Validation with Zod schemas at the top of each route.

### Environment variables required

```
MONGODB_URI
ENCRYPTION_KEY          # 64-char hex (AES-256 key)
NEXTAUTH_SECRET
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
MP_ACCESS_TOKEN         # Platform-level MP token (for subscription/webhook verification)
MP_WEBHOOK_SECRET
CRON_SECRET
# Optional:
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
EMAIL_FROM
```
