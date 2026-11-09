<div align="center">

# الرؤية · Al-Ru'ya

**Organize children's visits and schedules after separation — calmly and clearly**

**تنظيم زيارات الأطفال وجدولهم بعد الانفصال — بهدوء ووضوح**

[Live Demo](https://al-ruya.vercel.app)

![Al-Ru'ya](docs/screenshots/ruya-home.jpg)

</div>

---

## About the Project

When parents separate, the child is often caught in the middle of confusion: who has the child this weekend, was the visit confirmed, what happened in the child's day?

Al-Ru'ya puts everything in one calm place. Each parent sees the child's weekly schedule, visits are confirmed by both sides, and the child has a simple space to keep in touch with each parent. Each child's data stays private.

The app works in Arabic (RTL) and English.

## المشروع ده إيه؟

لما الأب والأم بينفصلوا، الطفل غالبًا بيبقى في النص وسط لخبطة: مين معاه الطفل الويك إند ده؟ الزيارة اتأكدت ولا لأ؟ يومه كان عامل إزاي؟

الرؤية بتجمع كل ده في مكان واحد هادي. كل واحد من الأهل بيشوف جدول الطفل الأسبوعي، والزيارات بتتأكد من الطرفين، والطفل عنده مساحة بسيطة يتواصل منها مع أبوه وأمه. وبيانات كل طفل خاصة بيه لوحده.

الموقع بيشتغل بالعربي والإنجليزي.

---

## Screenshots — صور من الموقع

| Register — إنشاء حساب للأهل | Sign In (English) — تسجيل الدخول |
| :---: | :---: |
| ![Register](docs/screenshots/ruya-register.jpg) | ![Sign in](docs/screenshots/ruya-login-en.jpg) |

---

## Features — المميزات

**For Parents — للأهل**

| Feature | Description | الميزة |
| --- | --- | --- |
| Children | Add each child and manage their profile | إضافة كل طفل وإدارة بياناته |
| Invitations | Invite the other parent or the child by email link | دعوة الطرف التاني أو الطفل بلينك على الإيميل |
| Weekly schedule | A shared weekly schedule both parents can see | جدول أسبوعي مشترك بيشوفه الأب والأم |
| Visits | Plan visits and confirm them from both sides | تنظيم الزيارات وتأكيدها من الطرفين |
| Child's day | A daily log of the child's day | سجل يومي ليوم الطفل |
| Messages | Message the child directly | رسايل مباشرة مع الطفل |
| Notifications | Alerts for visits, schedule changes and messages | تنبيهات بالزيارات وتغييرات الجدول والرسايل |

**For the Child — للطفل**

| Feature | Description | الميزة |
| --- | --- | --- |
| My schedule | See the week and upcoming visits | يشوف جدوله والزيارات الجاية |
| My day | Follow the day's plan | يتابع يومه |
| Messages | Talk to each parent separately | يكلّم كل واحد من أهله لوحده |

**Accounts — الحسابات**

Sign in with email and password, a magic email link, or a phone code · password reset · Google sign-in (optional).

تسجيل دخول بالإيميل والباسورد، أو بلينك على الإيميل، أو بكود على الموبايل · استرجاع الباسورد · الدخول بجوجل (اختياري).

---

## Tech Stack — التقنيات المستخدمة

| Layer | Technologies |
| --- | --- |
| Frontend — الواجهة | Next.js, React, TypeScript, Lucide icons |
| Backend — السيرفر | Node.js, Express, TypeScript, JWT, Zod validation, Helmet, rate limiting, Nodemailer |
| Database — قاعدة البيانات | MongoDB with Mongoose |
| Shared — مشترك | `packages/shared`: shared types and validation used by both web and API |
| Testing — الاختبارات | Vitest, Supertest, in-memory MongoDB |

Monorepo structure:

```
apps/api         Express + MongoDB API
apps/web         Next.js web app
packages/shared  Shared types and validation
```

---

## Run Locally — التشغيل على جهازك

Requires Node 20+.

Create `apps/api/.env`:

```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/ruya
JWT_SECRET= # 32+ random characters
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

Tests:

```bash
npm test
npm run typecheck
```

---

<div align="center">

Made by **Samaa Abo Diab** · [Portfolio](https://samaa-portfolio21.vercel.app) · [LinkedIn](https://www.linkedin.com/in/samaa-abo-diab)

</div>
