import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import { longDate } from './format'

// Layout reproduced from the approved template (US Letter landscape, 792 x 612 points).
const C = {
  paper: rgb(0.952941, 0.921569, 0.87451),
  espresso: rgb(0.188235, 0.145098, 0.121569),
  terracotta: rgb(0.568627, 0.294118, 0.215686),
  rule: rgb(0.74902, 0.65098, 0.580392),
  white: rgb(1, 0.98, 0.945),
}

export type CertificateRender = {
  serial: string
  recipientName: string
  courseTitle: string
  completionDate: string
  issueDate: string
  verificationUrl: string
  sample: boolean
  issuedAt: Date
  alanteSignature: Buffer | null
  justineSignature: Buffer | null
}

const asset = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), 'assets', ...p))

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = C.espresso, cx = 396) {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: cx - w / 2, y, size, font, color })
}

function tracked(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, tracking: number, color = C.terracotta) {
  let cursor = x
  for (const ch of text) {
    page.drawText(ch, { x: cursor, y, size, font, color })
    cursor += font.widthOfTextAtSize(ch, size) + tracking
  }
  return cursor - x - tracking
}

function trackedWidth(text: string, font: PDFFont, size: number, tracking: number) {
  return [...text].reduce((w, ch) => w + font.widthOfTextAtSize(ch, size) + tracking, -tracking)
}

function fitSize(text: string, font: PDFFont, max: number, maxWidth: number, min = 12) {
  let size = max
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5
  return size
}

function signatureOrPlaceholder(page: PDFPage, img: PDFImage | null, box: { x: number; y: number; w: number; h: number }, font: PDFFont) {
  if (img) {
    page.drawImage(img, { x: box.x, y: box.y, width: box.w, height: box.h })
    return
  }
  page.drawRectangle({ x: box.x, y: box.y, width: box.w, height: box.h, borderColor: C.terracotta, borderWidth: 0.6, borderDashArray: [3, 2] })
  centered(page, 'SIGNATURE ARTWORK PLACEHOLDER', box.y + box.h / 2 - 3, font, 6.5, C.terracotta, box.x + box.w / 2)
}

export async function renderCertificatePdf(input: CertificateRender): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  pdf.setTitle(`Certificate of Completion ${input.serial}`)
  pdf.setAuthor('The Ivory Cradle School')
  pdf.setSubject(`${input.courseTitle}, awarded to ${input.recipientName}`)
  pdf.setProducer('The Ivory Cradle School')
  pdf.setCreator('The Ivory Cradle School')
  pdf.setCreationDate(input.issuedAt)
  pdf.setModificationDate(input.issuedAt)

  // Embedded whole: subsetting this font with fontkit drops glyphs.
  const serif = await pdf.embedFont(asset('fonts', 'NotoSerifDisplay-Regular.ttf'), { subset: false })
  const semibold = await pdf.embedFont(asset('fonts', 'OpenSans-SemiBold.ttf'), { subset: true })
  const sans = await pdf.embedFont(asset('fonts', 'OpenSans-Regular.ttf'), { subset: true })
  const bold = await pdf.embedFont(asset('fonts', 'OpenSans-Bold.ttf'), { subset: true })
  const seal = await pdf.embedPng(asset('brand', 'seal.png'))
  const wordmark = await pdf.embedPng(asset('brand', 'wordmark.png'))
  const alante = input.alanteSignature ? await pdf.embedPng(input.alanteSignature) : null
  const justine = input.justineSignature ? await pdf.embedPng(input.justineSignature) : null

  const page = pdf.addPage([792, 612])
  page.drawRectangle({ x: 0, y: 0, width: 792, height: 612, color: C.paper })
  page.drawRectangle({ x: 24, y: 24, width: 744, height: 564, borderColor: C.terracotta, borderWidth: 1 })
  page.drawRectangle({ x: 31, y: 31, width: 730, height: 550, borderColor: C.rule, borderWidth: 0.55 })

  // Faint centered seal and the editorial wordmark at their approved size and position.
  page.drawImage(seal, { x: 246, y: 115, width: 300, height: 300 })
  page.drawImage(wordmark, { x: 303, y: 474, width: 186, height: 64.70783 })

  centered(page, 'Certificate of Completion', 420, serif, 49)
  centered(page, 'THIS CERTIFICATE IS AWARDED TO', 379, semibold, 10)

  const nameSize = fitSize(input.recipientName, serif, 30, 500)
  centered(page, input.recipientName, 326, serif, nameSize)
  page.drawLine({ start: { x: 135, y: 315 }, end: { x: 657, y: 315 }, thickness: 0.65, color: C.rule })

  centered(page, 'FOR SUCCESSFULLY COMPLETING', 284, semibold, 10)
  const titleSize = fitSize(input.courseTitle, serif, 21, 530)
  centered(page, input.courseTitle, 233, serif, titleSize)
  page.drawLine({ start: { x: 121, y: 223 }, end: { x: 671, y: 223 }, thickness: 0.65, color: C.rule })

  centered(page, 'DATE OF COMPLETION', 191, semibold, 9, C.terracotta)
  centered(page, longDate(input.completionDate), 162, serif, 14)
  page.drawLine({ start: { x: 306, y: 155 }, end: { x: 486, y: 155 }, thickness: 0.65, color: C.rule })

  // Founders' signatures with the approved placement (Justine's signature straightened).
  signatureOrPlaceholder(page, alante, { x: 177.64603, y: 109, w: 138.70796, h: 34 }, semibold)
  signatureOrPlaceholder(page, justine, { x: 486.87098, y: 109, w: 116.25806, h: 34 }, semibold)
  page.drawLine({ start: { x: 158, y: 104 }, end: { x: 336, y: 104 }, thickness: 0.65, color: C.terracotta })
  page.drawLine({ start: { x: 456, y: 104 }, end: { x: 634, y: 104 }, thickness: 0.65, color: C.terracotta })
  centered(page, 'Alante Velez', 82, serif, 17, C.espresso, 247)
  centered(page, 'CO-FOUNDER & CEO', 65, semibold, 8, C.espresso, 247)
  centered(page, 'Justine Akinlami', 82, serif, 17, C.espresso, 545)
  centered(page, 'CO-FOUNDER & CEO', 65, semibold, 8, C.espresso, 545)

  // Verification block between the signatures: QR code, serial number and web address.
  const qr = QRCode.create(input.verificationUrl, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const qrSize = 56
  const quiet = 3
  const cell = qrSize / n
  const qx = 396 - qrSize / 2
  const qy = 58
  page.drawRectangle({ x: qx - quiet, y: qy - quiet, width: qrSize + quiet * 2, height: qrSize + quiet * 2, color: C.white })
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        page.drawRectangle({ x: qx + c * cell, y: qy + qrSize - (r + 1) * cell, width: cell + 0.02, height: cell + 0.02, color: C.espresso })
      }
    }
  }
  const serialLabel = `SERIAL ${input.serial}`
  const sw = trackedWidth(serialLabel, semibold, 7.5, 0.6)
  tracked(page, serialLabel, 396 - sw / 2, 46, semibold, 7.5, 0.6, C.espresso)
  const host = input.verificationUrl.replace(/^https?:\/\//, '').replace(/\/v\/.*$/, '')
  centered(page, `Verify at ${host}/verify`, 37, sans, 6.5, C.espresso)

  if (input.sample) {
    const label = 'SAMPLE'
    const lw = trackedWidth(label, bold, 10, 2.2)
    for (const x of [44, 748 - lw - 12]) {
      page.drawRectangle({ x, y: 553, width: lw + 12, height: 19, borderColor: C.terracotta, borderWidth: 0.9 })
      tracked(page, label, x + 6, 559.5, bold, 10, 2.2, C.terracotta)
    }
    centered(page, 'Sample certificate', 563, sans, 6.5, C.terracotta, 396)
  }

  const bytes = await pdf.save({ useObjectStreams: false })
  return Buffer.from(bytes)
}
