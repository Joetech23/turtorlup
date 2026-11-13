"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Eye, EyeOff, Globe, KeyRound, Play, Plus, Webhook } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Enquiry } from "@/lib/types";
import { cn } from "@/lib/utils";

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[11px] text-slate-400">
        <span>{label ?? "code"}</span>
        <button
          className="flex cursor-pointer items-center gap-1 hover:text-white"
          onClick={() => {
            navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

const noopSubscribe = () => () => {};

const EVENTS = ["enquiry.created", "enquiry.stage_changed", "student.enrolled", "lesson.attended", "lesson.cancelled", "invoice.paid", "invoice.overdue"];

export default function WebsitePage() {
  const { ws, dispatch } = useWorkspace();
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "https://your-tutorloop.vercel.app",
  );
  const [reveal, setReveal] = useState(false);
  const [tryRes, setTryRes] = useState<string>("");
  const [hooks, setHooks] = useState([
    { url: "https://hooks.zapier.com/hooks/catch/123456/brightpath", events: ["enquiry.created", "student.enrolled"], active: true },
    { url: "https://brightpath-tutoring.co.uk/api/tutorloop", events: ["invoice.paid"], active: false },
  ]);
  const slug = ws.org.slug;
  const key = ws.org.apiKey;

  const tryIt = async () => {
    setTryRes("Sending…");
    const res = await fetch("/api/v1/enquiries", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ parent_name: "Adaora Nwachukwu", email: "adaora.n@example.com", phone: "07700 900456", student_name: "Chisom Nwachukwu", year_group: "Year 11", subjects: ["Maths", "Physics"], message: "Sent from the API playground", source: "API" }),
    });
    const json = await res.json();
    setTryRes(`HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`);
    if (res.ok && ws.mode === "demo") {
      const d = json.data;
      const e: Enquiry = { id: d.id, orgId: ws.org.id, parentName: d.parent_name, email: d.email, phone: d.phone, studentName: d.student_name, yearGroup: d.year_group, subjects: d.subjects, source: d.source, stage: "new", message: d.message, createdAt: d.created_at, updatedAt: d.created_at, value: 180 };
      dispatch({ type: "enquiry.create", at: d.created_at, enquiry: e });
    }
  };

  const script = `<!-- Paste where you want the form to appear -->
<div id="tutorloop-enquiry"></div>
<script src="${origin}/embed.js" data-org="${slug}" async></script>`;
  const iframe = `<iframe src="${origin}/embed/enquiry/${slug}"
  style="width:100%;min-height:620px;border:0" title="Enquiry form"></iframe>`;
  const curl = `curl -X POST ${origin}/api/v1/enquiries \\
  -H "Authorization: Bearer ${reveal ? key : "tl_demo_••••••••"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "parent_name": "Ngozi Okafor",
    "email": "ngozi@example.com",
    "phone": "07700 900123",
    "student_name": "Tobi Okafor",
    "year_group": "Year 10",
    "subjects": ["Maths"],
    "message": "Looking for GCSE support"
  }'`;
  const js = `await fetch("${origin}/api/v1/enquiries", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + process.env.TUTORLOOP_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ parent_name, email, student_name, subjects }),
});`;
  const webhookPayload = `POST https://your-server.com/webhooks/tutorloop
X-Tutorloop-Signature: t=1763049600,v1=5f2c…

{
  "event": "enquiry.created",
  "organisation": "${slug}",
  "data": {
    "id": "enq_7k2m9x",
    "parent_name": "Ngozi Okafor",
    "student_name": "Tobi Okafor",
    "stage": "new",
    "source": "Website form"
  }
}`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Website & API" description="Connect Tutorloop to your website, booking pages and other tools. No developer needed for the form." />
      <Tabs defaultValue="form">
        <TabsList>
          <TabsTrigger value="form">
            <Globe /> Enquiry form
          </TabsTrigger>
          <TabsTrigger value="api">
            <KeyRound /> API
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook /> Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>1. Copy this onto your website</CardTitle>
                  <CardDescription>Works with WordPress, Wix, Squarespace, Webflow or plain HTML.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <CodeBlock code={script} label="Recommended: script tag (auto-resizes)" />
                <CodeBlock code={iframe} label="Or: simple iframe" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>2. That&apos;s it</CardTitle>
                  <CardDescription>Every submission:</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-1.5 text-sm text-muted-foreground">
                  <li>• lands in Enquiries → New, tagged “Website form”</li>
                  <li>• gets an instant email + WhatsApp reply (simulated in this demo)</li>
                  <li>• creates a call-back task for your front desk</li>
                  <li>• uses your brand colour ({ws.org.brandColour}), set in Settings</li>
                </ul>
                <Button variant="outline" className="mt-4" asChild>
                  <a href={`/embed/enquiry/${slug}`} target="_blank" rel="noreferrer">
                    Open the form on its own
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span className="flex gap-1">
                <span className="size-2.5 rounded-full bg-rose-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="mx-auto rounded-md bg-card px-3 py-0.5">{ws.org.website}/contact</span>
            </div>
            <div className="bg-slate-50 p-3">
              <p className="mb-1 px-1 text-xs text-muted-foreground">Live preview: try submitting it, then check Enquiries.</p>
              <iframe src={`/embed/enquiry/${slug}?colour=${ws.org.brandColour.replace("#", "")}`} title="Enquiry form preview" className="h-[680px] w-full rounded-xl border-0 bg-transparent" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="grid gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>API key</CardTitle>
                <CardDescription>Keep this secret. Use it from your server, never in public web pages.</CardDescription>
              </div>
              <Badge variant="success">Active</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm">{reveal ? key : `${key.slice(0, 8)}${"•".repeat(16)}`}</code>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setReveal(!reveal)}>
                  {reveal ? <EyeOff /> : <Eye />} {reveal ? "Hide" : "Reveal"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(key).catch(() => {}); toast.success("API key copied"); }}>
                  <Copy /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast("Key rotation is disabled in the demo workspace")}>
                  Rotate
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>
                    <Badge variant="info" className="mr-2 font-mono">POST</Badge>/api/v1/enquiries
                  </CardTitle>
                  <CardDescription>Create an enquiry from any system: your own booking page, a landing page builder, Zapier, Make…</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <CodeBlock code={curl} label="cURL" />
                <CodeBlock code={js} label="JavaScript (server)" />
                <div className="text-xs text-muted-foreground">
                  Required: <code>parent_name</code>, <code>student_name</code>, and <code>email</code> or <code>phone</code>. Optional: <code>year_group</code>, <code>subjects</code>, <code>message</code>, <code>source</code>. Returns <code>201</code> with the new enquiry, <code>401</code> for a bad key, <code>422</code> with field errors.
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Try it now</CardTitle>
                  <CardDescription>Sends a real request to this app&apos;s API with your demo key.</CardDescription>
                </div>
                <Button size="sm" onClick={tryIt}>
                  <Play /> Send test request
                </Button>
              </CardHeader>
              <CardContent>
                <pre className={cn("min-h-64 overflow-x-auto rounded-xl border bg-slate-950 p-3 font-mono text-[12px] text-emerald-300", !tryRes && "text-slate-500")}>{tryRes || "// Response appears here. The new enquiry also shows up in Enquiries → New."}</pre>
                <div className="mt-3 text-xs text-muted-foreground">
                  Also available: <code className="font-mono">GET /api/v1/enquiries</code> lists the 50 most recent enquiries.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>We POST a signed JSON event to these URLs when things happen.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setHooks([...hooks, { url: "https://example.com/new-endpoint", events: ["lesson.attended"], active: true }])}>
                <Plus /> Add
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {hooks.map((h, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate font-mono text-[12px]">{h.url}</code>
                    <Switch checked={h.active} onCheckedChange={(v) => setHooks(hooks.map((x, j) => (j === i ? { ...x, active: v } : x)))} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {EVENTS.map((ev) => {
                      const on = h.events.includes(ev);
                      return (
                        <button
                          key={ev}
                          onClick={() => setHooks(hooks.map((x, j) => (j === i ? { ...x, events: on ? x.events.filter((y) => y !== ev) : [...x.events, ev] } : x)))}
                          className={cn("cursor-pointer rounded-full border px-2 py-0.5 font-mono text-[11px]", on ? "border-primary bg-primary/10 text-accent-foreground" : "text-muted-foreground")}
                        >
                          {ev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Demo: webhook deliveries are simulated and these settings aren&apos;t saved.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Example delivery</CardTitle>
                <CardDescription>Verify the signature with your webhook secret. Failed deliveries retry for 24 hours.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <CodeBlock code={webhookPayload} label="HTTP" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
