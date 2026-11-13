// Short address printed in certificate QR codes. Opens the verification page with the serial filled in.
export async function GET(req: Request, ctx: { params: Promise<{ serial: string }> }) {
  const { serial } = await ctx.params
  const url = new URL(`/verify?serial=${encodeURIComponent(serial.slice(0, 64))}`, req.url)
  return new Response(null, { status: 302, headers: { Location: url.pathname + url.search, 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
}
