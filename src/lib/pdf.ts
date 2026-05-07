// src/lib/pdf.ts
// Server-side PDF generation using pdfkit.
// Generates: SaaS subscription receipts, gym GST invoices, simple payment receipts.

import fs from "fs"
import path from "path"
import PDFDocument from "pdfkit"

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png")
const HAS_LOGO  = fs.existsSync(LOGO_PATH)

const GYMSTACK_ORANGE = "#f97316"
const DARK_BG = "#0d1117"
const LIGHT_GRAY = "#6b7280"
const DARK_TEXT = "#111827"

function buildPdf(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", c => chunks.push(c))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    draw(doc)
    doc.end()
  })
}

function formatCurrency(amount: number) {
  return `Rs. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function shortId(id: string) {
  return id.replace(/-/g, "").substring(0, 8).toUpperCase()
}

// ── Orange header bar with GymStack branding ─────────────────────────────────
function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.rect(0, 0, doc.page.width, 80).fill(GYMSTACK_ORANGE)
  if (HAS_LOGO) {
    doc.image(LOGO_PATH, 50, 12, { height: 56 })
  } else {
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff").text("GymStack", 50, 22)
    doc.font("Helvetica").fontSize(10).fillColor("rgba(255,255,255,0.8)").text("gymstack.co.in", 50, 48)
  }
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#ffffff")
    .text(title, 0, 25, { align: "right", width: doc.page.width - 50 })
  if (subtitle) {
    doc.font("Helvetica").fontSize(10).fillColor("rgba(255,255,255,0.8)")
      .text(subtitle, 0, 47, { align: "right", width: doc.page.width - 50 })
  }
  doc.moveDown(4)
}

// ── Gym header bar — shows gym branding, secondary "Powered by GymStack" ────
function drawGymHeader(doc: PDFKit.PDFDocument, gymName: string, title: string, subtitle?: string) {
  doc.rect(0, 0, doc.page.width, 80).fill("#1e293b")
  doc.font("Helvetica-Bold").fontSize(20).fillColor("#ffffff")
    .text(gymName, 50, 22)
  if (HAS_LOGO) {
    doc.image(LOGO_PATH, 50, 47, { height: 16 })
    doc.font("Helvetica").fontSize(9).fillColor("rgba(255,255,255,0.45)")
      .text("Powered by GymStack", 70, 50)
  } else {
    doc.font("Helvetica").fontSize(9).fillColor("rgba(255,255,255,0.45)")
      .text("Powered by GymStack", 50, 48)
  }
  doc.font("Helvetica-Bold").fontSize(18).fillColor(GYMSTACK_ORANGE)
    .text(title, 0, 22, { align: "right", width: doc.page.width - 50 })
  if (subtitle) {
    doc.font("Helvetica").fontSize(10).fillColor("rgba(255,255,255,0.6)")
      .text(subtitle, 0, 44, { align: "right", width: doc.page.width - 50 })
  }
  doc.moveDown(4)
}

// ── Divider line ─────────────────────────────────────────────────────────────
function drawDivider(doc: PDFKit.PDFDocument) {
  const y = doc.y
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor("#e5e7eb").lineWidth(1).stroke()
  doc.moveDown(0.8)
}

// ── Two-column info block (From / To) ────────────────────────────────────────
function drawPartyRow(
  doc: PDFKit.PDFDocument,
  leftLabel: string, leftLines: string[],
  rightLabel: string, rightLines: string[],
) {
  const midX = doc.page.width / 2
  const startY = doc.y
  doc.font("Helvetica-Bold").fontSize(9).fillColor(LIGHT_GRAY)
    .text(leftLabel.toUpperCase(), 50, startY)
  doc.font("Helvetica-Bold").fontSize(9).fillColor(LIGHT_GRAY)
    .text(rightLabel.toUpperCase(), midX, startY)

  const lineHeight = 15
  leftLines.forEach((line, i) => {
    if (!line) return
    doc.font(i === 0 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(i === 0 ? 11 : 10)
      .fillColor(DARK_TEXT)
      .text(line, 50, startY + 14 + i * lineHeight, { width: midX - 70 })
  })
  rightLines.forEach((line, i) => {
    if (!line) return
    doc.font(i === 0 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(i === 0 ? 11 : 10)
      .fillColor(DARK_TEXT)
      .text(line, midX, startY + 14 + i * lineHeight, { width: midX - 60 })
  })

  const maxLines = Math.max(leftLines.filter(Boolean).length, rightLines.filter(Boolean).length)
  doc.y = startY + 14 + maxLines * lineHeight + 6
  doc.moveDown(0.5)
}

// ── Meta row (key: value pairs) ───────────────────────────────────────────────
function drawMeta(doc: PDFKit.PDFDocument, rows: [string, string][]) {
  const bg = "#f9fafb"
  const rowHeight = 22
  const total = rows.length * rowHeight + 16
  doc.rect(50, doc.y, doc.page.width - 100, total).fill(bg).stroke("#e5e7eb")
  const startY = doc.y + 8
  rows.forEach(([key, val], i) => {
    const y = startY + i * rowHeight
    doc.font("Helvetica").fontSize(9).fillColor(LIGHT_GRAY).text(key, 62, y, { width: 150 })
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK_TEXT).text(val, 220, y, { width: 300, align: "left" })
  })
  doc.y = doc.y + total + 8
  doc.moveDown(0.3)
}

// ── Items table ───────────────────────────────────────────────────────────────
function drawItemsTable(
  doc: PDFKit.PDFDocument,
  rows: { description: string; qty: number; rate: number; amount: number }[],
) {
  const cols = { desc: 50, qty: 310, rate: 380, amt: 460 }
  const headerH = 24
  // Header
  doc.rect(50, doc.y, doc.page.width - 100, headerH).fill("#f3f4f6").stroke("#e5e7eb")
  const hy = doc.y + 7
  doc.font("Helvetica-Bold").fontSize(9).fillColor(LIGHT_GRAY)
  doc.text("DESCRIPTION", cols.desc + 8, hy)
  doc.text("QTY", cols.qty, hy)
  doc.text("RATE", cols.rate, hy)
  doc.text("AMOUNT", cols.amt, hy)
  doc.y = doc.y + headerH

  rows.forEach((row, i) => {
    const rowH = 26
    if (i % 2 === 0) doc.rect(50, doc.y, doc.page.width - 100, rowH).fill("#ffffff").stroke("#f3f4f6")
    const ry = doc.y + 8
    doc.font("Helvetica").fontSize(10).fillColor(DARK_TEXT)
    doc.text(row.description, cols.desc + 8, ry, { width: 240 })
    doc.text(String(row.qty), cols.qty, ry)
    doc.text(formatCurrency(row.rate), cols.rate, ry)
    doc.font("Helvetica-Bold").text(formatCurrency(row.amount), cols.amt, ry)
    doc.y = doc.y + rowH
  })
}

// ── Total section ─────────────────────────────────────────────────────────────
function drawTotals(
  doc: PDFKit.PDFDocument,
  subtotal: number,
  cgst: number | null,
  sgst: number | null,
  total: number,
) {
  const labelX = 360
  const valX = 460
  const w = doc.page.width - 50 - valX
  doc.moveDown(0.5)
  drawDivider(doc)

  const rows: [string, number, boolean][] = [
    ["Subtotal", subtotal, false],
    ...(cgst !== null ? [["CGST (9%)", cgst, false] as [string, number, boolean]] : []),
    ...(sgst !== null ? [["SGST (9%)", sgst, false] as [string, number, boolean]] : []),
    ["Total", total, true],
  ]

  rows.forEach(([label, val, bold]) => {
    const y = doc.y
    doc.font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 12 : 10)
      .fillColor(bold ? DARK_TEXT : LIGHT_GRAY)
      .text(label, labelX, y, { width: 90 })
    doc.font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 12 : 10)
      .fillColor(bold ? GYMSTACK_ORANGE : DARK_TEXT)
      .text(formatCurrency(val), valX, y, { width: w, align: "right" })
    doc.moveDown(0.5)
  })
}

// ── Footer ────────────────────────────────────────────────────────────────────
function drawFooter(doc: PDFKit.PDFDocument, note?: string) {
  doc.moveDown(1.5)
  drawDivider(doc)
  doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
    .text(
      note ?? "This is a computer-generated document. No signature required.",
      50, doc.y,
      { width: doc.page.width - 100, align: "center" },
    )
  doc.moveDown(0.8)
  if (HAS_LOGO) {
    // fit: [w, h] caps the rendered height so doc.y can be set explicitly
    const LOGO_MAX_W = 100
    const LOGO_MAX_H = 30
    const beforeY = doc.y
    doc.image(LOGO_PATH, (doc.page.width - LOGO_MAX_W) / 2, beforeY, {
      fit: [LOGO_MAX_W, LOGO_MAX_H],
    })
    doc.y = beforeY + LOGO_MAX_H + 6   // known gap below the capped image
  }
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GYMSTACK_ORANGE)
    .text("Powered by GymStack · gymstack.co.in", 50, doc.y, {
      width: doc.page.width - 100, align: "center",
    })
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═════════════════════════════════════════════════════════════════════════════

export interface SaasReceiptData {
  receiptNumber: string
  paidAt: Date | string
  planName: string
  amount: number
  razorpayPaymentId?: string | null
  razorpayOrderId?: string | null
  buyerName: string
  buyerEmail: string
  subscriptionId: string
}

export async function generateSaasReceipt(data: SaasReceiptData): Promise<Buffer> {
  return buildPdf(doc => {
    drawHeader(doc, "PAYMENT RECEIPT", `Receipt #${data.receiptNumber}`)

    // Meta
    drawMeta(doc, [
      ["Receipt Number", data.receiptNumber],
      ["Date", formatDate(data.paidAt)],
      ["Status", "PAID"],
      ...(data.razorpayPaymentId ? [["Transaction ID", data.razorpayPaymentId] as [string, string]] : []),
      ...(data.razorpayOrderId ? [["Order ID", data.razorpayOrderId] as [string, string]] : []),
    ])

    doc.moveDown(0.5)
    drawPartyRow(
      doc,
      "From",
      ["GymStack Platform", "gymstack.co.in", "support@gymstack.co.in"],
      "To",
      [data.buyerName, data.buyerEmail],
    )

    drawDivider(doc)

    drawItemsTable(doc, [
      { description: `GymStack Platform Plan — ${data.planName}`, qty: 1, rate: data.amount, amount: data.amount },
    ])

    drawTotals(doc, data.amount, null, null, data.amount)

    doc.moveDown(1)
    doc.font("Helvetica").fontSize(9).fillColor(LIGHT_GRAY)
      .text(
        "Thank you for subscribing to GymStack! Your subscription is now active. " +
        "For any billing queries, reach us at support@gymstack.co.in.",
        50, doc.y, { width: doc.page.width - 100 },
      )

    drawFooter(doc, "This receipt is generated automatically by GymStack upon successful payment.")
  })
}

export interface GymPaymentData {
  paymentId: string
  paymentDate: Date | string
  paymentMethod: string
  planName: string
  amount: number
  memberName: string
  memberEmail: string
  memberPhone?: string | null
  gymName: string
  gymAddress?: string | null
  gymCity?: string | null
  gymState?: string | null
  gymPincode?: string | null
  gymContact?: string | null
  gstNumber?: string | null
  gstRegisteredName?: string | null
}

export async function generateGymGstInvoice(data: GymPaymentData): Promise<Buffer> {
  const invoiceNumber = `INV-${formatDate(data.paymentDate).replace(/ /g, "").toUpperCase()}-${shortId(data.paymentId)}`

  // GST breakdown (18% inclusive)
  const base    = Math.round((data.amount / 118) * 100 * 100) / 100
  const gstAmt  = Math.round((data.amount - base) * 100) / 100
  const cgst    = Math.round(gstAmt / 2 * 100) / 100
  const sgst    = Math.round(gstAmt / 2 * 100) / 100

  const sellerName = data.gstRegisteredName ?? data.gymName

  const gymAddressLines = [
    data.gymAddress,
    [data.gymCity, data.gymState].filter(Boolean).join(", "),
    data.gymPincode,
    data.gymContact ? `Ph: ${data.gymContact}` : null,
  ].filter(Boolean) as string[]

  return buildPdf(doc => {
    drawGymHeader(doc, data.gymName, "TAX INVOICE", `Invoice #${invoiceNumber}`)

    drawMeta(doc, [
      ["Invoice Number", invoiceNumber],
      ["Invoice Date", formatDate(data.paymentDate)],
      ["GSTIN (Seller)", data.gstNumber!],
      ["Payment Method", data.paymentMethod],
    ])

    doc.moveDown(0.5)
    drawPartyRow(
      doc,
      "From (Seller)",
      [sellerName, ...gymAddressLines],
      "To (Buyer)",
      [data.memberName, data.memberEmail, data.memberPhone ?? ""],
    )

    drawDivider(doc)

    drawItemsTable(doc, [
      { description: data.planName, qty: 1, rate: base, amount: base },
    ])

    drawTotals(doc, base, cgst, sgst, data.amount)

    doc.moveDown(1)
    doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
      .text("HSN/SAC: 999331 (Recreational and sport services)", 50, doc.y)
    doc.moveDown(0.5)
    doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
      .text("* GST is inclusive in the total amount. This invoice is valid for GST input credit claim.", 50, doc.y)

    drawFooter(doc, `Tax Invoice issued by ${sellerName} · Powered by GymStack`)
  })
}

export async function generateGymSimpleReceipt(data: GymPaymentData): Promise<Buffer> {
  const receiptNumber = `RCP-${formatDate(data.paymentDate).replace(/ /g, "").toUpperCase()}-${shortId(data.paymentId)}`

  const gymAddressLines = [
    data.gymAddress,
    [data.gymCity, data.gymState].filter(Boolean).join(", "),
    data.gymContact ? `Ph: ${data.gymContact}` : null,
  ].filter(Boolean) as string[]

  return buildPdf(doc => {
    drawGymHeader(doc, data.gymName, "PAYMENT RECEIPT", `Receipt #${receiptNumber}`)

    drawMeta(doc, [
      ["Receipt Number", receiptNumber],
      ["Date", formatDate(data.paymentDate)],
      ["Payment Method", data.paymentMethod],
      ["Status", "PAID"],
    ])

    doc.moveDown(0.5)
    drawPartyRow(
      doc,
      "From",
      [data.gymName, ...gymAddressLines],
      "To",
      [data.memberName, data.memberEmail, data.memberPhone ?? ""],
    )

    drawDivider(doc)

    drawItemsTable(doc, [
      { description: data.planName, qty: 1, rate: data.amount, amount: data.amount },
    ])

    drawTotals(doc, data.amount, null, null, data.amount)

    doc.moveDown(1)
    doc.font("Helvetica").fontSize(9).fillColor(LIGHT_GRAY)
      .text(
        `Thank you for your payment to ${data.gymName}.`,
        50, doc.y, { width: doc.page.width - 100 },
      )

    drawFooter(doc, `Receipt issued by ${data.gymName} · Powered by GymStack`)
  })
}
