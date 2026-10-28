# الرؤية · Al-Ruya

Organizes children's visits after separation: parents follow visits and schedules, and the child keeps in touch with each parent. Arabic and English.

## Structure

```
apps/api         Express 5 + Mongoose (MongoDB). All permission checks live here.
apps/web         Next.js (App Router). Calls the API through a same-origin /api rewrite.
packages/shared  Zod schemas, roles, error codes and types used by both apps.
```

## Run locally

Requires Node 20+.

```bash
npm install
cp apps/api/.env.example apps/api/.env        # then set JWT_SECRET
cp apps/web/.env.example apps/web/.env.local

npm run dev:db    # local MongoDB on 27017 if you don't have one (data in apps/api/.dev-db)
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

If MongoDB is already installed, skip `dev:db` and point `MONGODB_URI` at it.

## Tests

```bash
npm test          # shared unit tests + API integration tests (in-memory MongoDB)
npm run typecheck
```

## Conventions

- **Responses:** `{ success: true, data }` or `{ success: false, error: { code, message, fields? } }`. The web app maps `code` and `fields` values to Arabic and English text in `apps/web/src/lib/i18n.ts`.
- **Permissions:** every child-scoped request goes through `findAccessibleChild` in `apps/api/src/modules/children/children.service.ts`. A parent must be in the child's `parents`; a child account only sees itself. Unrelated users get 404.
- **Layers:** route (auth, role, validation) → controller (req/res only) → service (rules and DB).
- **RTL:** `dir` and `lang` are set on `<html>` from the `ruya_lang` cookie. Use logical CSS properties (`margin-inline-start`, not `margin-left`).

## Done so far

| Story | Status |
| --- | --- |
| US-01 Parent registration | Done |
| US-02 Child account (age 10+) | Done |
| US-03 Child sign-in, "no permission" on parent pages | Done |
| US-05 Sibling data isolation | Server check in place; applied to each new feature |
| US-16 Arabic / English | Language switch, RTL, localized dates and numbers |
| US-04 Invite the other parent | Done (emails are logged until a mail provider is added) |
| US-06 Child's weekly schedule | Next |

## Before launch

- **Email:** `apps/api/src/utils/mailer.ts` only logs emails, including invitation links. Plug in a real provider (Resend, SES, SMTP) before production, and stop logging message bodies.
