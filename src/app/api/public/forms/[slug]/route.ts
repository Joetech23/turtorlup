import { NextResponse, type NextRequest } from "next/server";
import { createEnquiry, orgForSlug, toApi, validateEnquiry } from "@/lib/data/enquiries";

export const dynamic = "force-dynamic";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Public endpoint used by the embeddable enquiry form. No secret key: identified by the organisation's slug. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const orgId = await orgForSlug(slug);
  if (!orgId) return NextResponse.json({ error: { code: "not_found" } }, { status: 404, headers: CORS });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "invalid_json" } }, { status: 400, headers: CORS });
  }
  // Honeypot: bots fill hidden fields.
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true }, { headers: CORS });
  const v = validateEnquiry({ ...body, source: "Website form" });
  if (!v.ok) return NextResponse.json({ error: { code: "validation_failed", fields: v.errors } }, { status: 422, headers: CORS });
  const enquiry = await createEnquiry(orgId, v.value);
  return NextResponse.json({ ok: true, data: toApi(enquiry) }, { status: 201, headers: CORS });
}
