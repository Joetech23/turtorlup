import "server-only";
import type { Enquiry, EnquirySource } from "@/lib/types";
import type { Action } from "@/lib/store/actions";
import { uid } from "@/lib/store/actions";
import { isSupabaseConfigured } from "./config";
import { DEMO_API_KEY, DEMO_ORG_ID, buildDemoWorkspace } from "@/lib/demo/seed";
import { supabaseAdmin } from "@/lib/supabase/server";
import { persistForOrg } from "./persist-core";

/** In demo mode, enquiries posted to the API are kept in server memory so the open app can pick them up. */
type Inbox = { actions: Action[] };
const g = globalThis as unknown as { __tutorloopInbox?: Inbox };
export const demoInbox: Inbox = (g.__tutorloopInbox ??= { actions: [] });

export type EnquiryInput = {
  parent_name?: unknown;
  email?: unknown;
  phone?: unknown;
  student_name?: unknown;
  year_group?: unknown;
  subjects?: unknown;
  message?: unknown;
  source?: unknown;
};

const SOURCES: EnquirySource[] = ["Website form", "Referral", "Facebook", "Instagram", "Walk-in", "Google", "Phone", "API"];
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validateEnquiry(body: EnquiryInput): { ok: true; value: Omit<Enquiry, "id" | "orgId" | "createdAt" | "updatedAt" | "stage" | "value"> } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const parentName = str(body.parent_name, 120);
  const email = str(body.email, 200);
  const phone = str(body.phone, 40);
  const studentName = str(body.student_name, 120);
  if (!parentName) errors.parent_name = "Required";
  if (!studentName) errors.student_name = "Required";
  if (!email && !phone) errors.email = "Provide an email or phone number";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Not a valid email address";
  const subjects = Array.isArray(body.subjects) ? body.subjects.map((s) => str(s, 40)).filter(Boolean).slice(0, 6) : typeof body.subjects === "string" ? body.subjects.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6) : [];
  const source = SOURCES.includes(body.source as EnquirySource) ? (body.source as EnquirySource) : "API";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { parentName, email, phone, studentName, yearGroup: str(body.year_group, 20) || "Not given", subjects: subjects.length ? subjects : ["General"], message: str(body.message, 2000) || "Sent via website", source },
  };
}

/** Resolve an API key to an organisation id. */
export async function orgForApiKey(key: string | null): Promise<string | null> {
  if (!key) return null;
  if (!isSupabaseConfigured()) return key === DEMO_API_KEY ? DEMO_ORG_ID : null;
  const { data } = await supabaseAdmin().from("api_keys").select("org_id").eq("key", key).maybeSingle();
  return (data?.org_id as string | undefined) ?? null;
}

/** Resolve a public form slug (used by the embeddable form, no secret key). */
export async function orgForSlug(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return slug === "brightpath" ? DEMO_ORG_ID : null;
  const { data } = await supabaseAdmin().from("organisations").select("id").eq("slug", slug).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function createEnquiry(orgId: string, input: NonNullable<ReturnType<typeof validateEnquiry> & { ok: true }>["value"]): Promise<Enquiry> {
  const at = new Date().toISOString();
  const enquiry: Enquiry = { ...input, id: uid("enq"), orgId, stage: "new", createdAt: at, updatedAt: at, value: 180 };
  const action: Action = { type: "enquiry.create", at, enquiry };
  if (!isSupabaseConfigured()) {
    demoInbox.actions = [...demoInbox.actions, action].slice(-50);
  } else {
    await persistForOrg(orgId, action);
  }
  return enquiry;
}

export async function listEnquiries(orgId: string): Promise<Enquiry[]> {
  if (!isSupabaseConfigured()) {
    const fresh = demoInbox.actions.filter((a) => a.type === "enquiry.create").map((a) => (a as Extract<Action, { type: "enquiry.create" }>).enquiry);
    return [...fresh.reverse(), ...buildDemoWorkspace().enquiries].slice(0, 50);
  }
  const { data, error } = await supabaseAdmin().from("enquiries").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  const { rowToObj } = await import("./mapping");
  return (data ?? []).map((r) => rowToObj<Enquiry>(r));
}

export function toApi(e: Enquiry) {
  return {
    id: e.id,
    stage: e.stage,
    parent_name: e.parentName,
    email: e.email,
    phone: e.phone,
    student_name: e.studentName,
    year_group: e.yearGroup,
    subjects: e.subjects,
    message: e.message,
    source: e.source,
    created_at: e.createdAt,
  };
}
