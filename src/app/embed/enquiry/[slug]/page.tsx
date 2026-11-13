import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/data/config";
import { buildDemoWorkspace } from "@/lib/demo/seed";
import { supabaseAdmin } from "@/lib/supabase/server";
import { EmbedForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiry form", robots: { index: false } };

async function orgBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    const org = buildDemoWorkspace().org;
    return org.slug === slug ? { name: org.name, brandColour: org.brandColour } : null;
  }
  const { data } = await supabaseAdmin().from("organisations").select("name, brand_colour").eq("slug", slug).maybeSingle();
  return data ? { name: data.name as string, brandColour: data.brand_colour as string } : null;
}

export default async function EmbedEnquiryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ colour?: string }> }) {
  const { slug } = await params;
  const { colour } = await searchParams;
  const org = await orgBySlug(slug);
  if (!org) notFound();
  const brand = colour && /^#?[0-9a-f]{6}$/i.test(colour) ? `#${colour.replace("#", "")}` : org.brandColour;
  return <EmbedForm slug={slug} orgName={org.name} brand={brand} />;
}
