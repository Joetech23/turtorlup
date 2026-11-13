"use client";

import { useState } from "react";
import { BellRing, CheckCircle2, CreditCard, Download, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/input";
import { useWorkspace } from "@/lib/store/provider";
import { invoiceBadge, invoiceState, invoiceTotal } from "@/lib/selectors";
import { fmt } from "@/lib/dates";
import { money } from "@/lib/utils";
import { uid } from "@/lib/store/actions";

export function InvoiceDialog({ invoice, onOpenChange }: { invoice: Invoice | null; onOpenChange: (v: boolean) => void }) {
  const { ws, dispatch, now } = useWorkspace();
  const [method, setMethod] = useState<NonNullable<Invoice["paymentMethod"]>>("Card");
  const inv = invoice ? ws.invoices.find((i) => i.id === invoice.id) ?? invoice : null;
  if (!inv) return <Dialog open={false} />;
  const fam = ws.families.find((f) => f.id === inv.familyId);
  const payer = ws.guardians.find((g) => g.familyId === inv.familyId && g.isBillPayer) ?? ws.guardians.find((g) => g.familyId === inv.familyId);
  const state = invoiceState(inv, now);
  const total = invoiceTotal(inv);
  const at = () => new Date().toISOString();

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-start justify-between gap-4 rounded-t-2xl border-b bg-muted/40 p-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: ws.org.brandColour }}>
              <span className="flex size-6 items-center justify-center rounded-md text-xs text-white" style={{ background: ws.org.brandColour }}>
                {ws.org.name[0]}
              </span>
              {ws.org.name}
            </div>
            <DialogTitle className="mt-3 text-2xl font-bold">Invoice {inv.number}</DialogTitle>
            <DialogDescription>
              Issued {fmt.date(inv.issuedAt)} · Due {fmt.date(inv.dueAt)}
            </DialogDescription>
          </div>
          <div className="pr-6 text-right">
            <Badge variant={invoiceBadge[state].variant}>{invoiceBadge[state].label}</Badge>
            <div className="mt-2 font-display text-3xl font-bold tabular">{money(total, ws.org.currency, { decimals: true })}</div>
          </div>
        </div>
        <div className="grid gap-5 p-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Billed to</div>
              <div className="font-medium">
                {payer?.firstName} {payer?.lastName}
              </div>
              <div className="text-muted-foreground">{fam?.address}</div>
              <div className="text-muted-foreground">{payer?.email}</div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-muted-foreground">From</div>
              <div className="font-medium">{ws.org.name}</div>
              <div className="text-muted-foreground">{ws.org.address}</div>
              <div className="text-muted-foreground">{ws.org.email}</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Price</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inv.lines.map((l, i) => (
                <tr key={i}>
                  <td className="py-2">{l.description}</td>
                  <td className="py-2 text-right tabular">{l.quantity}</td>
                  <td className="py-2 text-right tabular">{money(l.unitPrice, ws.org.currency, { decimals: true })}</td>
                  <td className="py-2 text-right font-medium tabular">{money(l.quantity * l.unitPrice, ws.org.currency, { decimals: true })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td colSpan={3} className="py-2 text-right font-semibold">
                  Total
                </td>
                <td className="py-2 text-right font-bold tabular">{money(total, ws.org.currency, { decimals: true })}</td>
              </tr>
            </tfoot>
          </table>

          {inv.status === "paid" ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="size-4" /> Paid {inv.paidAt && fmt.date(inv.paidAt)} by {inv.paymentMethod?.toLowerCase()}
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="text-sm font-semibold">Take payment</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <NativeSelect value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="sm:w-44">
                  <option>Card</option>
                  <option>Bank transfer</option>
                  <option>Cash</option>
                  <option>Direct debit</option>
                </NativeSelect>
                <Button onClick={() => { dispatch({ type: "invoice.pay", at: at(), id: inv.id, method }); toast.success(`${inv.number} marked as paid`, { description: `${money(total)} by ${method.toLowerCase()} (demo)` }); }}>
                  <CreditCard /> Record payment
                </Button>
                <Button variant="outline" onClick={() => dispatch({ type: "invoice.remind", at: at(), id: inv.id, msgId: uid("msg") })}>
                  <BellRing /> Send reminder
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {inv.remindersSent} reminder{inv.remindersSent === 1 ? "" : "s"} sent so far. With Stripe connected, parents pay by card from a secure link and this updates automatically.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(`https://pay.tutorlup.app/i/${inv.number}`).catch(() => {}); toast.success("Payment link copied", { description: "Demo link: no real payment page." }); }}>
              <Link2 /> Copy payment link
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Download /> Print / PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
