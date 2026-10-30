# الرؤية · Al-Ru'ya

Organizes children's visits and schedules after separation. Parents follow visits and the weekly schedule, and the child keeps in touch with each parent. Arabic and English.

## Stack

```
apps/api         Express + MongoDB
apps/web         Next.js
packages/shared  Shared types and validation
```

## Run locally

Requires Node 20+.

Create `apps/api/.env`:

```bash
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/ruya
JWT_SECRET=        # 32+ random characters
WEB_ORIGIN=http://localhost:3000
```

Optional: `SMTP_*` for email, `GOOGLE_CLIENT_*` for Google sign-in, `TWILIO_*` for phone codes.

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev:db    # local MongoDB (skip if you have one)
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

## Tests

```bash
npm test
npm run typecheck
```
