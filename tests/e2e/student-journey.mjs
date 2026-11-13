// End to end acceptance run for the staging requirements.
// Plays the real lesson video at normal speed, so it takes several minutes.
//
//   BASE_URL=http://localhost:3100 DATABASE_URL=postgres://.../ivory_school_test node tests/e2e/student-journey.mjs
//
// Needs a fresh, seeded database, Playwright (Chromium), poppler (pdftoppm) and zbar (zbarimg).
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import postgres from 'postgres'

const require = createRequire(import.meta.url)
const { chromium, devices } = require('playwright')

const BASE = process.env.BASE_URL || 'http://localhost:3100'
const sql = postgres(process.env.DATABASE_URL, { max: 2, onnotice: () => {} })
const OUT = process.env.OUT_DIR || path.join(process.cwd(), 'tests', 'output')
const SHOTS = process.env.SHOTS_DIR || path.join(OUT, 'screenshots')
fs.mkdirSync(SHOTS, { recursive: true })
const RUN = Date.now().toString(36)
const PASSWORD = 'correct horse battery'
const ADMIN = { email: 'admin@school.test', password: process.env.ADMIN_PASSWORD || 'local-admin-pass' }

const results = []
async function check(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log('  PASS', name)
  } catch (e) {
    results.push({ name, ok: false, error: e.message })
    console.log('  FAIL', name, '\n      ', e.message.split('\n')[0])
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex')
const shot = (page, name, full = true) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full })

const CORRECT = [1, 3, 0, 2, 1] // answer key for The First Overnight Shift (server side only)

async function register(page, name, email) {
  await page.goto(`${BASE}/register`)
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL(/\/dashboard/)
}

async function signIn(page, email, password = PASSWORD) {
  await page.goto(`${BASE}/sign-in`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/dashboard|\/admin/)
}

async function enroll(page) {
  await page.goto(`${BASE}/courses/the-first-overnight-shift`)
  await page.getByRole('button', { name: 'Enroll now' }).click()
  await page.waitForURL(/\/learn\/[0-9a-f-]{36}$/)
  return page.url().split('/').pop()
}

const cycle = async (enrollmentId) =>
  (await sql`select * from viewing_cycles where enrollment_id = ${enrollmentId} order by cycle_no desc limit 1`)[0]

async function waitForVideo(page) {
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1, null, { timeout: 30000 })
}
const videoTime = (page) => page.evaluate(() => document.querySelector('video').currentTime)

async function play(page) {
  await waitForVideo(page)
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('video').paused)
}
async function pause(page) {
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await sleep(600)
}
async function watchToEnd(page) {
  await play(page)
  await page.getByText('Lesson complete. The quiz is unlocked.').waitFor({ timeout: 600000 })
}

async function confirmName(page, enrollmentId, name) {
  await page.goto(`${BASE}/learn/${enrollmentId}/quiz`)
  await page.getByLabel('Name to print on the certificate').fill(name)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Confirm and continue to the quiz' }).click()
  await page.waitForSelector('form.quiz')
}

async function answerQuiz(page, picks, { doubleClick = false } = {}) {
  for (let i = 0; i < 5; i++) await page.locator(`input[name="q${i + 1}"][value="${picks[i]}"]`).check()
  await page.getByRole('button', { name: 'Review answers' }).click()
  const submit = page.getByRole('button', { name: 'Submit for grading' })
  if (doubleClick) await submit.dblclick()
  else await submit.click()
  await page.locator('[aria-live="polite"] .notice').first().waitFor({ timeout: 20000 })
  return page.locator('[aria-live="polite"] .notice').first().innerText()
}

async function downloadPdf(page, href) {
  const res = await page.request.get(`${BASE}${href}`)
  assert.equal(res.status(), 200, `GET ${href} returned ${res.status()}`)
  return Buffer.from(await res.body())
}

function qrFromPdf(buf, name) {
  const pdf = path.join(OUT, `${name}.pdf`)
  fs.writeFileSync(pdf, buf)
  execFileSync('pdftoppm', ['-r', '110', '-png', '-singlefile', pdf, path.join(OUT, name)])
  const out = execFileSync('zbarimg', ['-q', '--raw', path.join(OUT, `${name}.png`)], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  return out
}

const browser = await chromium.launch()
const desktop = () => browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true })
const phone = () => browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true })

const A = { name: 'Jordan Rivera', email: `jordan.${RUN}@student.test` }
const B = { name: 'Taylor Brooks', email: `taylor.${RUN}@student.test` }

// ---------------------------------------------------------------------------------------------
async function studentA() {
  const ctx1 = await desktop()
  const p1 = await ctx1.newPage()
  console.log('Student A: enroll, worksheet, partial viewing, resume on another device, pass')
  await register(p1, A.name, A.email)
  A.enrollment = await enroll(p1)

  await check('A1 worksheet downloads right after enrolling', async () => {
    const dl = p1.waitForEvent('download')
    await p1.getByRole('link', { name: 'Download PDF' }).click()
    const file = await dl
    const buf = fs.readFileSync(await file.path())
    assert.equal(buf.subarray(0, 5).toString(), '%PDF-')
    assert.match(file.suggestedFilename(), /Worksheet\.pdf$/)
  })

  await play(p1)
  await sleep(22000)
  await pause(p1)
  await p1.evaluate(() => window.scrollTo(0, 0))
  await shot(p1, 'student-lesson-desktop', false)
  let c = await cycle(A.enrollment)
  await check('A1 partial viewing is saved on the server (about 22 seconds)', async () => {
    assert.ok(Number(c.watched_seconds) >= 14 && Number(c.watched_seconds) <= 24, `watched ${c.watched_seconds}`)
    assert.equal(c.status, 'watching')
  })

  const pausedAt = await videoTime(p1)
  await check('A2 forward seeking past the watched point is blocked', async () => {
    await p1.evaluate(() => { document.querySelector('video').currentTime = 80 })
    await sleep(500)
    const t = await videoTime(p1)
    assert.ok(t <= pausedAt + 0.5, `video jumped to ${t} (watched up to ${pausedAt})`)
    await p1.getByText('You can replay anything you have watched').waitFor({ timeout: 3000 })
  })
  await check('A2 faster playback is reset to normal speed', async () => {
    const rate = await p1.evaluate(async () => { const v = document.querySelector('video'); v.playbackRate = 2; await new Promise((r) => setTimeout(r, 200)); return v.playbackRate })
    assert.equal(rate, 1)
  })
  await check('A2 replaying an already watched section is allowed', async () => {
    await p1.evaluate(() => { document.querySelector('video').currentTime = 4 })
    await sleep(400)
    const t = await videoTime(p1)
    assert.ok(Math.abs(t - 4) < 0.6, `replay position ${t}`)
  })
  await check('A2 a burst of forged progress reports cannot jump ahead (server enforced)', async () => {
    const before = Number((await cycle(A.enrollment)).watched_seconds)
    await Promise.all(Array.from({ length: 10 }, () =>
      p1.request.post(`${BASE}/api/learn/${A.enrollment}/progress`, { data: { cycleId: c.id, position: 95 }, headers: { Origin: BASE } })))
    const after = Number((await cycle(A.enrollment)).watched_seconds)
    assert.ok(after - before <= 7.8, `burst moved progress from ${before} to ${after}`)
  })
  await check('A2 steady forged reports never credit faster than real time', async () => {
    const before = Number((await cycle(A.enrollment)).watched_seconds)
    const t0 = Date.now()
    for (let i = 0; i < 4; i++) {
      await sleep(3200)
      await p1.request.post(`${BASE}/api/learn/${A.enrollment}/progress`, { data: { cycleId: c.id, position: 95 }, headers: { Origin: BASE } })
    }
    const wall = (Date.now() - t0) / 1000
    const gained = Number((await cycle(A.enrollment)).watched_seconds) - before
    assert.ok(gained <= wall + 0.75 * 4 + 0.5, `gained ${gained}s of viewing in ${wall}s`)
    assert.equal((await cycle(A.enrollment)).status, 'watching')
  })
  await check('A2 a fake "video ended" report cannot unlock the quiz', async () => {
    await sleep(3200)
    const r = await p1.request.post(`${BASE}/api/learn/${A.enrollment}/progress`, { data: { cycleId: c.id, position: 96 }, headers: { Origin: BASE } })
    const body = await r.json()
    assert.equal(body.viewingComplete, false)
    const q = await p1.request.post(`${BASE}/api/learn/${A.enrollment}/quiz`, { data: { submissionKey: crypto.randomUUID().replace(/-/g, ''), answers: {} }, headers: { Origin: BASE } })
    assert.equal((await q.json()).status, 'viewing_incomplete')
  })
  await check('A2 the quiz page explains why it is locked and how much remains', async () => {
    await p1.goto(`${BASE}/learn/${A.enrollment}/quiz`)
    await p1.getByText('Finish the lesson to unlock the quiz.').waitFor()
    await p1.getByText(/of the lesson left/).waitFor()
    await p1.getByRole('link', { name: 'Contact the school' }).waitFor()
  })

  // Another device: phone.
  const ctx2 = await phone()
  const p2 = await ctx2.newPage()
  await signIn(p2, A.email)
  c = await cycle(A.enrollment)
  await check('A1 resume on another device starts at the furthest watched point', async () => {
    await p2.getByRole('link', { name: 'Resume lesson' }).first().click()
    await waitForVideo(p2)
    await sleep(800)
    const t = await videoTime(p2)
    assert.ok(Math.abs(t - Number(c.watched_seconds)) < 2, `phone resumed at ${t}, server watched ${c.watched_seconds}`)
  })
  await shot(p2, 'student-lesson-mobile')

  await watchToEnd(p2)
  await check('A3 completing the video on the server unlocks the quiz', async () => {
    const c2 = await cycle(A.enrollment)
    assert.equal(c2.status, 'quiz_open')
    assert.equal(c2.completed_by, 'viewing')
  })

  await confirmName(p1, A.enrollment, A.name)
  await check('A3 quiz page never contains the answer key or explanations', async () => {
    const html = await p1.content()
    assert.ok(!html.includes('correctIndex'))
    assert.ok(!html.includes('Clarify the plan while the parents are available'))
  })
  await shot(p1, 'student-quiz-desktop')
  const picks = [...CORRECT]
  picks[4] = 0 // one wrong answer: 4 of 5
  const text = await answerQuiz(p1, picks, { doubleClick: true })
  await check('A3 4 out of 5 passes and issues a certificate (double click on Submit)', async () => {
    assert.match(text, /You scored 4 out of 5 and passed/)
  })
  await shot(p1, 'student-passed-desktop', false)

  await check('A duplicate submissions (same key, other device, other keys) never add attempts or certificates', async () => {
    const k = crypto.randomUUID().replace(/-/g, '')
    const answers = Object.fromEntries(CORRECT.map((v, i) => [`q${i + 1}`, v]))
    const reqs = [p1, p1, p2, p2].map((p, i) =>
      p.request.post(`${BASE}/api/learn/${A.enrollment}/quiz`, { data: { submissionKey: i < 2 ? k : crypto.randomUUID().replace(/-/g, ''), answers }, headers: { Origin: BASE } }),
    )
    const bodies = await Promise.all((await Promise.all(reqs)).map((r) => r.json()))
    for (const b of bodies) assert.equal(b.status, 'already_passed')
    const [{ n }] = await sql`select count(*)::int n from quiz_attempts where enrollment_id = ${A.enrollment}`
    const [{ m }] = await sql`select count(*)::int m from certificates where enrollment_id = ${A.enrollment}`
    assert.equal(n, 1)
    assert.equal(m, 1)
  })

  const [cert] = await sql`select id, serial from certificates where enrollment_id = ${A.enrollment}`
  A.cert = cert
  await p1.goto(`${BASE}/dashboard`)
  await shot(p1, 'student-dashboard-desktop')
  const first = await downloadPdf(p1, `/api/certificates/${cert.id}/pdf`)
  A.certSha = sha(first)
  await check('A certificate QR code scans and opens verification with the serial filled in', async () => {
    const url = qrFromPdf(first, 'student-certificate')
    assert.equal(url, `${BASE}/v/${cert.serial}`)
    const v = await p1.goto(url)
    assert.ok(v.url().includes(`/verify?serial=${cert.serial}`))
    await p1.getByRole('heading', { name: 'Valid' }).waitFor()
    await p1.getByText(A.name).first().waitFor()
  })

  await check('A5 sign out, sign back in, same certificate file and serial', async () => {
    await p1.goto(`${BASE}/dashboard`)
    await p1.getByRole('button', { name: 'Sign out' }).click()
    await p1.waitForURL(`${BASE}/`)
    const r = await p1.request.get(`${BASE}/api/certificates/${cert.id}/pdf`)
    assert.equal(r.status(), 401)
    await signIn(p1, A.email)
    await p1.getByText(cert.serial).first().waitFor()
    const again = await downloadPdf(p1, `/api/certificates/${cert.id}/pdf`)
    assert.equal(sha(again), A.certSha)
  })
  await p2.goto(`${BASE}/dashboard`)
  await shot(p2, 'student-dashboard-mobile')
  A.ctx = ctx1
  A.page = p1
  A.ctx2 = ctx2
}

// ---------------------------------------------------------------------------------------------
async function studentB() {
  const ctx1 = await desktop()
  const p1 = await ctx1.newPage()
  console.log('Student B: three failed attempts, rewatch, three fresh attempts')
  await register(p1, B.name, B.email)
  B.enrollment = await enroll(p1)
  await watchToEnd(p1)
  await confirmName(p1, B.enrollment, B.name)

  const wrong = CORRECT.map((v) => (v + 1) % 4)
  let t = await answerQuiz(p1, wrong)
  await check('B4 failed attempt 1 shows the score and "You have 2 attempts left"', async () => {
    assert.match(t, /You scored [0-3] out of 5/)
    assert.match(t, /You have 2 attempts left/)
  })
  await shot(p1, 'student-failed-attempt-desktop', false)
  await p1.getByRole('button', { name: 'Try again' }).click()
  await p1.waitForSelector('form.quiz')
  t = await answerQuiz(p1, wrong)
  await check('B4 failed attempt 2 shows "You have 1 attempt left"', async () => assert.match(t, /You have 1 attempt left/))

  // Third attempt sent from two devices at the same moment with different keys.
  const ctx2 = await phone()
  const p2 = await ctx2.newPage()
  await signIn(p2, B.email)
  const answers = Object.fromEntries(wrong.map((v, i) => [`q${i + 1}`, v]))
  const [r1, r2] = await Promise.all(
    [p1, p2].map((p) => p.request.post(`${BASE}/api/learn/${B.enrollment}/quiz`, { data: { submissionKey: crypto.randomUUID().replace(/-/g, ''), answers }, headers: { Origin: BASE } })),
  )
  const bodies = [await r1.json(), await r2.json()]
  await check('B4 two devices submitting the last attempt at once use only one attempt', async () => {
    const graded = bodies.filter((b) => b.status === 'graded')
    assert.equal(graded.length, 1, JSON.stringify(bodies))
    assert.equal(bodies.find((b) => b.status !== 'graded').status, 'rewatch_required')
    const c = await cycle(B.enrollment)
    const [{ n }] = await sql`select count(*)::int n from quiz_attempts where cycle_id = ${c.id}`
    assert.equal(n, 3)
    assert.equal(c.status, 'locked')
  })
  await check('B4 quiz locks with "Rewatch the lesson to unlock 3 new attempts."', async () => {
    await p1.goto(`${BASE}/learn/${B.enrollment}/quiz`)
    await p1.getByText('Rewatch the lesson to unlock 3 new attempts.').first().waitFor()
    await p1.goto(`${BASE}/dashboard`)
    await p1.getByRole('link', { name: 'Rewatch required' }).waitFor()
  })
  await p2.goto(`${BASE}/dashboard`)
  await shot(p2, 'student-rewatch-required-mobile')

  await p1.goto(`${BASE}/learn/${B.enrollment}`)
  await p1.getByRole('button', { name: 'Start the rewatch' }).click()
  await waitForVideo(p1)
  await check('B4 rewatch starts a new viewing from the beginning and keeps history', async () => {
    const cycles = await sql`select cycle_no, status, watched_seconds from viewing_cycles where enrollment_id = ${B.enrollment} order by cycle_no`
    assert.equal(cycles.length, 2)
    assert.equal(cycles[0].status, 'locked')
    assert.equal(cycles[1].status, 'watching')
    assert.equal(Number(cycles[1].watched_seconds), 0)
    const [{ n }] = await sql`select count(*)::int n from quiz_attempts where enrollment_id = ${B.enrollment}`
    assert.equal(n, 3)
    assert.ok((await videoTime(p1)) < 1)
  })
  await check('B4 quiz stays locked during the rewatch, and seeking ahead is blocked again', async () => {
    const q = await p1.request.post(`${BASE}/api/learn/${B.enrollment}/quiz`, { data: { submissionKey: crypto.randomUUID().replace(/-/g, ''), answers }, headers: { Origin: BASE } })
    assert.equal((await q.json()).status, 'viewing_incomplete')
    await p1.evaluate(() => { document.querySelector('video').currentTime = 60 })
    await sleep(400)
    assert.ok((await videoTime(p1)) < 2)
  })
  await watchToEnd(p1)
  await check('B4 after the full rewatch, three fresh attempts are available', async () => {
    await p1.goto(`${BASE}/learn/${B.enrollment}`)
    await p1.getByText('You have 3 attempts left.').waitFor()
    await p1.goto(`${BASE}/learn/${B.enrollment}/quiz`)
    await p1.getByText('Attempt 1 of 3 for this viewing.').waitFor()
  })
  t = await answerQuiz(p1, CORRECT)
  await check('B passes on the new viewing with 5 out of 5', async () => assert.match(t, /You scored 5 out of 5 and passed/))
  B.cert = (await sql`select id, serial from certificates where enrollment_id = ${B.enrollment}`)[0]
  B.ctx = ctx1
  B.page = p1
  await ctx2.close()
}

// ---------------------------------------------------------------------------------------------
async function security() {
  console.log('Access control')
  const p = B.page
  await check('S one student cannot open another student’s lesson, quiz or files', async () => {
    for (const url of [`/learn/${A.enrollment}`, `/learn/${A.enrollment}/quiz`]) {
      const r = await p.goto(`${BASE}${url}`)
      assert.equal(r.status(), 404, url)
    }
    for (const part of ['video', 'captions', 'worksheet']) {
      const r = await p.request.get(`${BASE}/api/learn/${A.enrollment}/${part}`)
      assert.equal(r.status(), 404, part)
    }
    const r1 = await p.request.post(`${BASE}/api/learn/${A.enrollment}/progress`, { data: { cycleId: crypto.randomUUID(), position: 5 }, headers: { Origin: BASE } })
    assert.equal(r1.status(), 404)
    const r2 = await p.request.post(`${BASE}/api/learn/${A.enrollment}/quiz`, { data: { submissionKey: crypto.randomUUID().replace(/-/g, ''), answers: {} }, headers: { Origin: BASE } })
    assert.equal(r2.status(), 404)
  })
  await check('S one student cannot download another student’s certificate', async () => {
    const r = await p.request.get(`${BASE}/api/certificates/${A.cert.id}/pdf`)
    assert.equal(r.status(), 404)
  })
  await check('S signed out visitors cannot download certificates or open the dashboard', async () => {
    const ctx = await desktop()
    const anon = await ctx.newPage()
    assert.equal((await anon.request.get(`${BASE}/api/certificates/${A.cert.id}/pdf`)).status(), 401)
    await anon.goto(`${BASE}/dashboard`)
    assert.match(anon.url(), /\/sign-in/)
    await ctx.close()
  })
  await check('S cross site requests to change progress are rejected', async () => {
    const r = await p.request.post(`${BASE}/api/learn/${B.enrollment}/progress`, { data: { cycleId: crypto.randomUUID(), position: 5 }, headers: { Origin: 'https://evil.example' } })
    assert.equal(r.status(), 403)
  })
  await check('S students cannot reach staff pages or signature artwork; the blank template is not public', async () => {
    await p.goto(`${BASE}/admin`)
    assert.match(p.url(), /\/dashboard/)
    const [sig] = await sql`select alante_file_id from signature_sets where is_active`
    assert.equal((await p.request.get(`${BASE}/api/admin/files/${sig.alante_file_id}`)).status(), 404)
    for (const u of ['/private-assets/signatures/alante-velez-v1.png', '/signatures/alante-velez-v1.png', '/private-assets/reference/approved-certificate-template.pdf']) {
      assert.equal((await p.request.get(`${BASE}${u}`)).status(), 404, u)
    }
  })
}

// ---------------------------------------------------------------------------------------------
async function verification() {
  console.log('Public verification')
  const ctx = await phone()
  const p = await ctx.newPage()
  const verify = async (serial) => {
    await p.goto(`${BASE}/verify`)
    await p.getByLabel('Serial number').fill(serial)
    await p.getByRole('button', { name: 'Verify certificate' }).click()
    await p.locator('.result').waitFor()
    return p.locator('.result').innerText()
  }
  await check('V valid, typed in lowercase with spaces, does not expire', async () => {
    const t = await verify('  ics7kq4m2xd9prt ')
    assert.match(t, /Valid/)
    assert.match(t, /Jordan Taylor/)
    assert.match(t, /Certificate of Completion/)
    assert.match(t, /Does not expire/)
    assert.doesNotMatch(t, /Completion date/) // same as issue date, so not repeated
  })
  await shot(p, 'verify-valid-mobile')
  await check('V a student’s real certificate verifies as Valid', async () => assert.match(await verify(A.cert.serial), /Valid[\s\S]*Jordan Rivera/))
  await check('V mistyped serial shows Not valid', async () => assert.match(await verify('ICS7KQ4M2XD9PRA'), /Not valid\. Check the serial number and try again\./))
  await check('V malformed serial shows Not valid', async () => assert.match(await verify('ICS-7KQ4'), /Not valid/))
  await check('V partial serial is not accepted', async () => assert.match(await verify('ICS7KQ4M2X'), /Not valid/))
  await check('V expired credential shows Expired', async () => assert.match(await verify('ICSE3VN8HC5WQ2A'), /Expired[\s\S]*June 3, 2025/))
  await check('V revoked credential shows Revoked', async () => assert.match(await verify('ICSR6TJ9BK4ZM7F'), /Revoked/))
  await check('V replaced credential shows Replaced', async () => assert.match(await verify('ICSP2GH5WN8DX3K'), /Replaced/))
  await check('V replacement shows completion date separately from issue date', async () => {
    const t = await verify('ICSV9MC3QT6YB4J')
    assert.match(t, /Valid/)
    assert.match(t, /Completion date\s*October 20, 2026/)
    assert.match(t, /Issue date\s*October 22, 2026/)
  })
  await check('V results are excluded from search indexing', async () => {
    const r = await p.request.get(`${BASE}/verify?serial=ICS7KQ4M2XD9PRT`)
    assert.match(r.headers()['x-robots-tag'] || '', /noindex/)
    assert.match(await r.text(), /<meta name="robots" content="noindex/)
  })
  await shot(p, 'verify-replacement-mobile')
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------
async function staff() {
  console.log('Staff tools')
  const ctx = await desktop()
  const p = await ctx.newPage()
  await signIn(p, ADMIN.email, ADMIN.password)

  await check('T later edits (profile, signature set, expiration policy) never rewrite an issued certificate', async () => {
    await sql`update users set full_name = 'Changed Name' where email_normalized = ${A.email}`
    await sql`update credential_policies set validity_months = 12 where credential_type = 'certificate_of_completion'`
    const [s] = await sql`select alante_file_id, justine_file_id from signature_sets where is_active`
    await sql`update signature_sets set is_active = false where is_active`
    await sql`insert into signature_sets (label, alante_file_id, justine_file_id, is_active) values ('Test v2', ${s.alante_file_id}, ${s.justine_file_id}, true)`
    const again = await downloadPdf(A.page, `/api/certificates/${A.cert.id}/pdf`)
    assert.equal(sha(again), A.certSha)
    const [c] = await sql`select recipient_name, expires_on from certificates where id = ${A.cert.id}`
    assert.equal(c.recipient_name, 'Jordan Rivera')
    assert.equal(c.expires_on, null)
    await sql`update credential_policies set validity_months = null where credential_type = 'certificate_of_completion'`
    await sql`update users set full_name = ${A.name} where email_normalized = ${A.email}`
  })

  await check('T admin corrects a certificate: new serial, original Replaced, audit trail records who', async () => {
    await p.goto(`${BASE}/admin/certificates/${A.cert.id}`)
    await p.getByLabel('Recipient name').fill('Jordan M Rivera')
    await p.getByLabel('Reason (private)').first().fill('Student asked to add a middle initial')
    await p.getByRole('button', { name: 'Issue corrected replacement' }).click()
    await p.getByText('Corrected replacement issued').waitFor()
    const [n] = await sql`select id, serial, status, replaces_id from certificates where replaces_id = ${A.cert.id}`
    assert.ok(n && n.serial !== A.cert.serial && n.status === 'active')
    const [o] = await sql`select status from certificates where id = ${A.cert.id}`
    assert.equal(o.status, 'replaced')
    const ev = await sql`select a.action, u.email from audit_events a join users u on u.id = a.actor_id where a.entity_id = ${A.cert.id} and a.action = 'replaced'`
    assert.equal(ev[0].email, ADMIN.email)
    A.replacement = n
    const old = await A.page.request.get(`${BASE}/api/certificates/${A.cert.id}/pdf`)
    assert.equal(old.status(), 410)
    await downloadPdf(A.page, `/api/certificates/${n.id}/pdf`)
  })
  await shot(p, 'admin-certificate-desktop')

  await check('T admin revokes a certificate; verification shows Revoked without the private reason', async () => {
    await p.goto(`${BASE}/admin/certificates/${B.cert.id}`)
    await p.getByLabel('Reason (private)').nth(1).fill('Testing revocation on staging')
    await p.getByRole('button', { name: 'Revoke credential' }).click()
    await p.getByText('Credential revoked').waitFor()
    const r = await p.request.get(`${BASE}/verify?serial=${B.cert.serial}`)
    const html = await r.text()
    assert.match(html, /Revoked/)
    assert.doesNotMatch(html, /Testing revocation/)
  })

  await check('T course editor: draft edits stay private until published as a new version', async () => {
    const [course] = await sql`select id from courses where slug = 'the-first-overnight-shift'`
    await p.goto(`${BASE}/admin/courses/${course.id}`)
    await p.getByLabel('Catalog summary (one sentence)').fill('Updated summary for version two.')
    await p.getByRole('button', { name: 'Save draft' }).click()
    await p.getByText('Draft saved.').waitFor()
    let pub = await (await p.request.get(`${BASE}/courses/the-first-overnight-shift`)).text()
    assert.doesNotMatch(pub, /Updated summary for version two/)
    await p.getByRole('button', { name: /Publish draft as version 2/ }).click()
    await p.getByText('Published. New enrollments use this version.').waitFor()
    pub = await (await p.request.get(`${BASE}/courses/the-first-overnight-shift`)).text()
    assert.match(pub, /Updated summary for version two/)
    const [e] = await sql`select v.version_no from enrollments e join course_versions v on v.id = e.course_version_id where e.id = ${A.enrollment}`
    assert.equal(e.version_no, 1)
  })
  await shot(p, 'admin-course-editor-desktop')

  await check('T staff can grant an accessible alternative that unlocks the quiz (logged)', async () => {
    const ctxC = await desktop()
    const pc = await ctxC.newPage()
    await register(pc, 'Casey Morgan', `casey.${RUN}@student.test`)
    const id = await enroll(pc)
    await p.goto(`${BASE}/admin/students/${id}`)
    await p.getByLabel('Reason').fill('Completed the lesson transcript with staff')
    await p.getByRole('button', { name: 'Complete required viewing' }).click()
    await p.getByText('Accommodation recorded').waitFor()
    const c = await cycle(id)
    assert.equal(c.status, 'quiz_open')
    assert.equal(c.completed_by, 'accommodation')
    await ctxC.close()
  })
  await p.goto(`${BASE}/admin/students/${B.enrollment}`)
  await shot(p, 'admin-student-record-desktop')
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------
try {
  await Promise.all([studentA(), studentB()])
  await security()
  await verification()
  await staff()
  await check('V verification requests are rate limited', async () => {
    const ctx = await desktop()
    const p = await ctx.newPage()
    let limited = false
    for (let i = 0; i < 40 && !limited; i++) {
      const html = await (await p.request.get(`${BASE}/verify?serial=ICS0000000000${String(i).padStart(2, '0')}`)).text()
      limited = html.includes('Too many checks')
    }
    assert.ok(limited)
    await ctx.close()
  })
} catch (e) {
  console.error('Run stopped:', e)
  results.push({ name: 'run completed', ok: false, error: e.message })
} finally {
  await browser.close()
  await sql.end()
}
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length} of ${results.length} checks passed`)
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2))
process.exit(failed.length ? 1 : 0)
