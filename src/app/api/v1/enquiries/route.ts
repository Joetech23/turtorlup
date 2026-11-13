import { NextResponse, type NextRequest } from "next/server";
import { createEnquiry, listEnquiries, orgForApiKey, toApi, validateEnquiry } from "@/lib/data/enquiries";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Api-Key",
};

function keyFrom(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-api-key");
}

function unauthorised() {
  return NextResponse.json({ error: { code: "unauthorised", message: "Missing or invalid API key. Send it as 'Authorization: Bearer <key>'." } }, { status: 401, headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** List the 50 most recent enquiries. */
export async function GET(req: NextRequest) {
  const orgId = await orgForApiKey(keyFrom(req));
  if (!orgId) return unauthorised();
  const items = await listEnquiries(orgId);
  return NextResponse.json({ data: items.map(toApi) }, { headers: CORS });
}

/** Create an enquiry. Triggers the "new enquiry" automations (simulated). */
export async function POST(req: NextRequest) {
  const orgId = await orgForApiKey(keyFrom(req));
  if (!orgId) return unauthorised();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "invalid_json", message: "Body must be JSON." } }, { status: 400, headers: CORS });
  }
  const v = validateEnquiry({ ...body, source: body.source ?? "API" });
  if (!v.ok) return NextResponse.json({ error: { code: "validation_failed", fields: v.errors } }, { status: 422, headers: CORS });
  const enquiry = await createEnquiry(orgId, v.value);
  return NextResponse.json({ data: toApi(enquiry), automations: ["Instant reply to new enquiries (simulated)"] }, { status: 201, headers: CORS });
}
