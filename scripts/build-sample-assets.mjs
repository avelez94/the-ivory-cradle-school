// Builds the staging sample course media from the sources in design/:
//   private-assets/course-media/first-overnight-shift/{lesson.mp4, lesson.en.vtt, first-shift-checklist.pdf, manifest.json}
// Requires Playwright (Chromium) and ffmpeg. Usage: node scripts/build-sample-assets.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { SLIDES } from '../design/video/slides.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const out = path.join(root, 'private-assets', 'course-media', 'first-overnight-shift')
const work = path.join(root, '.build-assets')
fs.mkdirSync(out, { recursive: true })
fs.mkdirSync(work, { recursive: true })

const browser = await chromium.launch()

// 1. Worksheet: one US Letter page.
{
  const page = await browser.newPage()
  await page.goto('file://' + path.join(root, 'design', 'worksheets', 'first-shift-checklist.html'))
  await page.evaluate(() => document.fonts.ready)
  const pdfPath = path.join(out, 'first-shift-checklist.pdf')
  await page.pdf({ path: pdfPath, format: 'Letter', printBackground: true, preferCSSPageSize: true })
  const pages = (fs.readFileSync(pdfPath, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
  if (pages !== 1) throw new Error(`Worksheet must be one page, got ${pages}`)
  console.log('worksheet: 1 page')
  await page.close()
}

// 2. Lesson slides to video.
const fontsCss = fs.readFileSync(path.join(root, 'design', 'fonts', 'fonts.css'), 'utf8').replace(/url\('/g, `url('file://${path.join(root, 'design', 'fonts')}/`)
const wordmark = 'file://' + path.join(root, 'design', 'wordmark.png')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
let t = 0
const cues = []
const concat = []
for (const [i, s] of SLIDES.entries()) {
  const html = `<!doctype html><html><head><style>${fontsCss}
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1280px;height:720px;background:${s.cover ? '#30241F' : '#F8F1E6'};color:${s.cover ? '#FFFAF1' : '#30241F'};font-family:'DM Sans';position:relative;overflow:hidden}
    .wrap{position:absolute;left:96px;top:120px;right:96px}
    .kicker{font-size:19px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:${s.cover ? '#D6AB68' : '#8E3C2E'}}
    h1{font-family:'Bricolage Grotesque';font-weight:800;font-size:${s.cover ? 92 : 70}px;letter-spacing:-.04em;line-height:1.02;margin-top:18px;max-width:1000px}
    p{font-size:30px;line-height:1.45;margin-top:26px;color:${s.cover ? '#F0DFD1' : '#69554A'};max-width:960px}
    ul{list-style:none;margin-top:34px;border-top:1.5px solid #D6C4B4;max-width:880px}
    li{font-size:32px;padding:16px 0;border-bottom:1.5px solid #D6C4B4;display:flex;gap:22px;align-items:baseline}
    li span{font-family:'Bricolage Grotesque';font-weight:700;color:#8E3C2E;font-size:24px;width:40px}
    .tag{position:absolute;top:30px;right:36px;border:2px solid ${s.cover ? '#D6AB68' : '#8E3C2E'};color:${s.cover ? '#D6AB68' : '#8E3C2E'};font-weight:700;letter-spacing:.13em;font-size:15px;padding:8px 14px;text-transform:uppercase}
    .logo{position:absolute;top:26px;left:40px;height:58px;${s.cover ? 'filter:invert(1) sepia(.2) brightness(1.6)' : ''}}
    .foot{position:absolute;bottom:30px;left:96px;right:96px;display:flex;justify-content:space-between;font-size:16px;color:${s.cover ? '#F0DFD1' : '#69554A'};border-top:1.5px solid ${s.cover ? '#69554A' : '#D6C4B4'};padding-top:14px}
    </style></head><body>
    <img class="logo" src="${wordmark}">
    <div class="tag">Sample lesson placeholder</div>
    <div class="wrap"><div class="kicker">${esc(s.kicker)}</div><h1>${esc(s.title)}</h1>
    ${(s.body || []).map((b) => `<p>${esc(b)}</p>`).join('')}
    ${s.list ? `<ul>${s.list.map((li, n) => `<li><span>0${n + 1}</span>${esc(li)}</li>`).join('')}</ul>` : ''}</div>
    <div class="foot"><span>The First Overnight Shift</span><span>Placeholder for the HyperFrames lesson video · Part ${i + 1} of ${SLIDES.length}</span></div>
    </body></html>`
  const htmlPath = path.join(work, `slide-${i + 1}.html`)
  fs.writeFileSync(htmlPath, html)
  await page.goto('file://' + htmlPath) // a file URL so the local font files load
  await page.evaluate(() => document.fonts.ready)
  const png = path.join(work, `slide-${String(i + 1).padStart(2, '0')}.png`)
  await page.screenshot({ path: png })
  concat.push(`file '${png}'`, `duration ${s.seconds}`)
  cues.push({ start: t, end: t + s.seconds, text: s.caption })
  t += s.seconds
}
concat.push(concat[concat.length - 2]) // ffmpeg concat needs the last file repeated
await browser.close()
fs.writeFileSync(path.join(work, 'list.txt'), concat.join('\n'))

const mp4 = path.join(out, 'lesson.mp4')
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(work, 'list.txt'),
  '-f', 'lavfi', '-t', String(t), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
  '-vf', 'fps=25,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-g', '50',
  '-c:a', 'aac', '-b:a', '32k', '-shortest', '-t', String(t), '-movflags', '+faststart', mp4,
])
const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString().trim()
const durationSeconds = Math.round(Number(probe) * 100) / 100

const ts = (sec) => {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = (sec % 60).toFixed(3).padStart(6, '0')
  return `${h}:${m}:${s}`
}
const vtt = ['WEBVTT', '', ...cues.flatMap((c, i) => [String(i + 1), `${ts(c.start)} --> ${ts(Math.min(c.end, durationSeconds))}`, c.text, ''])].join('\n')
fs.writeFileSync(path.join(out, 'lesson.en.vtt'), vtt)
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ durationSeconds, placeholder: true, slides: SLIDES.length }, null, 2) + '\n')
fs.rmSync(work, { recursive: true, force: true })
console.log('video:', durationSeconds, 'seconds,', (fs.statSync(mp4).size / 1e6).toFixed(2), 'MB')
