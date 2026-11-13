# The Ivory Cradle School

Website and student portal for The Ivory Cradle School, founded by Alante Velez and Justine Akinlami. The school is affiliated with Ivory Cradle Care and runs as a separate business with its own brand, student accounts and administration.

This is the first staging version: professional development mini courses with a full student experience, a Coming Soon page for the flagship Newborn Care Specialist Training, public certificate verification, and staff administration.

## What is in it

* **Public site:** homepage, mini course catalog, course pages, Newborn Care Specialist Training (Coming Soon, with an update list), About the Founders, FAQ, Contact, student registration and sign in, Verify a Certificate.
* **Student portal:** dashboard with My Courses and My Certificates, lesson player with server enforced required viewing, one page worksheet download, five question quiz with three attempts per viewing and rewatch cycles, certificate name confirmation, automatic Certificate of Completion with serial number and QR code.
* **Administration:** course editor with draft, preview and versioned publishing; video upload or linking, captions and worksheet replacement; enrollments, viewing history, quiz attempts and completions; certificate correction, revocation and reissue with an audit trail; founder signature versions; expiration policies by credential type; enrollment and payment switches; staff roles; contact messages.
* **Staging course:** The First Overnight Shift, with a labeled placeholder lesson video and captions, a branded one page worksheet, five quiz questions, and sample certificates for every verification state.

See [docs/STAFF_GUIDE.md](docs/STAFF_GUIDE.md) for the staff guide (also in the staff area at `/admin/guide`).

## How the rules are enforced

* **Required viewing.** The player reports progress every few seconds. The server credits viewing only as fast as real time passes (see `src/lib/viewing.ts`), so seeking ahead, faster playback, forged requests or a fake "ended" event cannot unlock the quiz. Progress is saved per student, course version and viewing cycle, which is how resuming on another device works.
* **Quiz.** Graded on the server; answer keys never reach the browser. Each submission carries a key, and grading runs inside a transaction that locks the enrollment, so double clicks, refreshes and second devices cannot use extra attempts or issue a second certificate (`src/lib/quiz.ts`).
* **Certificates.** Issued in the same transaction as the passing grade. The record freezes the printed name, course title, dates, expiration, serial and signature version. The PDF is rendered once and stored, so every download returns identical bytes (`src/lib/certificates.ts`, `src/lib/certificate-pdf.ts`).
* **Privacy.** Lesson media, worksheets and certificate files are served only to the enrolled student (and staff). Signature artwork and the approved blank template live in `private-assets/`, never in `public/`. Verification shows only what is printed on the credential.

## Stack

Next.js 16 (App Router), React 19, PostgreSQL through `postgres`, `pdf-lib` for certificates, `qrcode`, and optional private Vercel Blob storage for uploaded lesson videos. No external auth service: accounts, sessions and roles are in the database.

## Run locally

```bash
npm install
```

```bash
cp .env.example .env.local
```

Set `DATABASE_URL` to a Postgres database, then:

```bash
npm run db:migrate
```

```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='choose a password' npm run db:seed
```

```bash
npm run dev
```

## Deploy (staging)

1. Create a Postgres database (Neon or Supabase from the Vercel marketplace both work) and a Vercel project for this repository.
2. Set environment variables: `DATABASE_URL`, `SITE_URL` (the staging address, for example `https://ivory-cradle-school.vercel.app`), `SCHOOL_ENVIRONMENT=staging`, `RATE_LIMIT_SALT` (any random string). Optional: `BLOB_READ_WRITE_TOKEN` from a private Blob store for staff video uploads, `SCHOOL_CONTACT_EMAIL`.
3. Run `npm run db:migrate` and `npm run db:seed` against the database with `SITE_URL` set to the staging address, so sample certificates point at it.
4. After the first deploy, regenerate the homepage sample image so its QR code shows the staging address: download `/sample-certificate.pdf` and render it to `public/samples/sample-certificate.png` at 144 dpi.

For production, set `SCHOOL_ENVIRONMENT=production` and `VERIFY_BASE_URL` to the school's verification address. Payments and flagship enrollment stay off until their phases.

## Sample assets

Regenerate them with `node scripts/build-sample-assets.mjs` (needs Playwright and ffmpeg). Sources are in `design/`. The worksheet build fails if the PDF is longer than one page.

## Tests

`tests/e2e/student-journey.mjs` is the acceptance run. It plays the real lesson at normal speed (several minutes) against a running server and a freshly seeded database:

```bash
BASE_URL=http://localhost:3100 DATABASE_URL=postgres://... node tests/e2e/student-journey.mjs
```
