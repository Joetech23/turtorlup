"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, Check, CreditCard, Plug, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { relative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Organisation, Role } from "@/lib/types";

const COLOURS = ["#4f46e5", "#0d9488", "#db2777", "#ea580c", "#16a34a", "#0284c7", "#7c3aed", "#1e293b"];

const ROLES: Record<Role, { label: string; can: string }> = {
  owner: { label: "Owner", can: "Everything, including billing and deleting the account" },
  admin: { label: "Admin", can: "Everything except the Tutorloop subscription" },
  staff: { label: "Front desk", can: "Enquiries, families, calendar, messages and invoices" },
  tutor: { label: "Tutor", can: "Only their own schedule, students, notes and reports" },
};

const INTEGRATIONS = [
  { id: "stripe", name: "Stripe", desc: "Card payments, Apple Pay and Direct Debit for invoices and packages.", colour: "#635bff", letter: "S", connected: true },
  { id: "gcal", name: "Google Calendar", desc: "Two-way sync of each tutor's lessons with their own calendar.", colour: "#1a73e8", letter: "G", connected: true },
  { id: "whatsapp", name: "WhatsApp Business", desc: "Send reminders and chat with parents from the inbox.", colour: "#25d366", letter: "W", connected: false },
  { id: "zoom", name: "Zoom", desc: "Auto-create a meeting link for every online lesson.", colour: "#2d8cff", letter: "Z", connected: false },
  { id: "twilio", name: "SMS (Twilio)", desc: "Text message reminders in the UK, Nigeria and 180+ countries.", colour: "#f22f46", letter: "T", connected: false },
  { id: "xero", name: "Xero", desc: "Push invoices and payments to your accounts automatically.", colour: "#13b5ea", letter: "X", connected: false },
  { id: "paystack", name: "Paystack", desc: "Take payments in naira by card, bank transfer and USSD.", colour: "#0ba4db", letter: "P", connected: false },
  { id: "zapier", name: "Zapier", desc: "Connect 6,000+ other apps without code.", colour: "#ff4f00", letter: "Z", connected: false },
];

export default function SettingsPage() {
  const { ws, dispatch } = useWorkspace();
  const params = useSearchParams();
  const [org, setOrg] = useState<Organisation>(ws.org);
  const [connected, setConnected] = useState<Record<string, boolean>>(Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected])));
  const [connecting, setConnecting] = useState<(typeof INTEGRATIONS)[number] | null>(null);
  const [invite, setInvite] = useState("");

  const save = (patch: Partial<Organisation>) => {
    dispatch({ type: "org.update", at: new Date().toISOString(), patch });
    toast.success("Settings saved");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" description="Your organisation, team and connected apps." />
      <Tabs defaultValue={params.get("tab") ?? "org"}>
        <TabsList>
          <TabsTrigger value="org">
            <Building2 /> Organisation
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users /> Team
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug /> Integrations
          </TabsTrigger>
          <TabsTrigger value="plan">
            <CreditCard /> Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="grid gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Organisation profile</CardTitle>
                <CardDescription>Shown on invoices, emails, the parent portal and your enquiry form.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Field label="Business name">
                <Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Input value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} />
              </Field>
              <Field label="Time zone">
                <NativeSelect value={org.timezone} onChange={(e) => setOrg({ ...org, timezone: e.target.value })}>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Africa/Lagos">Lagos (WAT)</option>
                  <option value="America/New_York">New York (ET)</option>
                </NativeSelect>
              </Field>
              <Field label="Currency" hint="The demo data is priced in pounds.">
                <NativeSelect value={org.currency} onChange={(e) => setOrg({ ...org, currency: e.target.value as Organisation["currency"] })}>
                  <option value="GBP">British pound (£)</option>
                  <option value="NGN">Nigerian naira (₦)</option>
                  <option value="USD">US dollar ($)</option>
                </NativeSelect>
              </Field>
              <div className="sm:col-span-2">
                <Button onClick={() => save({ name: org.name, website: org.website, email: org.email, phone: org.phone, address: org.address, timezone: org.timezone, currency: org.currency })}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Brand colour</CardTitle>
                <CardDescription>Used across the parent portal, invoices and your website enquiry form.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              {COLOURS.map((c) => (
                <button key={c} onClick={() => save({ brandColour: c })} className={cn("flex size-9 cursor-pointer items-center justify-center rounded-full ring-offset-2 transition", ws.org.brandColour === c && "ring-2 ring-foreground")} style={{ background: c }} aria-label={c}>
                  {ws.org.brandColour === c && <Check className="size-4 text-white" />}
                </button>
              ))}
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="color" value={ws.org.brandColour} onChange={(e) => dispatch({ type: "org.update", at: new Date().toISOString(), patch: { brandColour: e.target.value } })} className="size-9 cursor-pointer rounded-full border-0 bg-transparent" />
                Custom
              </label>
              <div className="ml-auto flex items-center gap-2 rounded-xl border p-2 pr-4">
                <span className="flex size-9 items-center justify-center rounded-lg font-bold text-white" style={{ background: ws.org.brandColour }}>
                  {ws.org.name[0]}
                </span>
                <span className="text-sm font-semibold" style={{ color: ws.org.brandColour }}>
                  {ws.org.name}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="grid gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Team members</CardTitle>
                <CardDescription>{ws.team.length} people · everyone signs in with their own email</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y py-1">
              {ws.team.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={m.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.email} · active <span suppressHydrationWarning>{relative(m.lastActive)}</span>
                    </div>
                  </div>
                  <Badge variant={m.role === "owner" ? "default" : m.role === "tutor" ? "secondary" : "info"}>{ROLES[m.role].label}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Invite someone</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row">
              <Input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="name@yourcentre.co.uk" />
              <NativeSelect className="sm:w-40" defaultValue="staff">
                {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([k, r]) => (
                  <option key={k} value={k}>
                    {r.label}
                  </option>
                ))}
              </NativeSelect>
              <Button
                onClick={() => {
                  toast.success("Invitation sent (demo)", { description: invite || "No email entered" });
                  setInvite("");
                }}
              >
                Send invite
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-4" /> What each role can do
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {Object.values(ROLES).map((r) => (
                <div key={r.label} className="rounded-xl border p-3 text-sm">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.can}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((i) => (
              <Card key={i.id} className="flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: i.colour }}>
                    {i.letter}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      {i.name} {connected[i.id] && <Badge variant="success">Connected</Badge>}
                    </div>
                    <p className="text-[13px] text-muted-foreground">{i.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  {connected[i.id] ? (
                    <Button variant="ghost" size="sm" onClick={() => setConnected({ ...connected, [i.id]: false })}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setConnecting(i)}>
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Demo workspace: integrations are illustrative and no external accounts are linked.</p>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Current plan</div>
                <div className="font-display text-2xl font-bold">{ws.org.plan}</div>
                <div className="text-sm text-muted-foreground">Up to 150 active students · 10 team members · unlimited automations</div>
              </div>
              <Button variant="outline" asChild>
                <Link href="/#pricing">Compare plans</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!connecting} onOpenChange={(o) => !o && setConnecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {connecting?.name}</DialogTitle>
            <DialogDescription>In a live account you&apos;d be taken to {connecting?.name} to sign in and approve access. In this demo nothing is linked.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConnecting(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (connecting) setConnected({ ...connected, [connecting.id]: true });
                toast.success(`${connecting?.name} connected (demo)`);
                setConnecting(null);
              }}
            >
              Simulate connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
