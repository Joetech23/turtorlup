"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useWorkspace } from "@/lib/store/provider";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { ChannelIcon } from "@/components/bits";
import { invoiceState, invoiceTotal } from "@/lib/selectors";
import { money } from "@/lib/utils";

export default function FamiliesPage() {
  const { ws, now } = useWorkspace();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    return ws.families
      .map((f) => {
        const guardians = ws.guardians.filter((g) => g.familyId === f.id);
        const kids = ws.students.filter((s) => s.familyId === f.id);
        const invs = ws.invoices.filter((i) => i.familyId === f.id);
        const owed = invs.filter((i) => ["sent", "overdue"].includes(invoiceState(i, now))).reduce((s, i) => s + invoiceTotal(i), 0);
        const overdue = invs.some((i) => invoiceState(i, now) === "overdue");
        const lifetime = invs.filter((i) => i.status === "paid").reduce((s, i) => s + invoiceTotal(i), 0);
        const active = kids.some((k) => k.status === "active");
        return { f, guardians, kids, owed, overdue, lifetime, active };
      })
      .filter((r) => {
        if (filter === "active" && !r.active) return false;
        if (filter === "owing" && !r.owed) return false;
        if (filter === "overdue" && !r.overdue) return false;
        const t = q.toLowerCase();
        return !t || `${r.f.name} ${r.guardians.map((g) => `${g.firstName} ${g.email}`).join(" ")} ${r.kids.map((k) => k.firstName).join(" ")}`.toLowerCase().includes(t);
      });
  }, [ws, q, filter, now]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Families" description={`${ws.families.length} families · parents, guardians and the children they look after`} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parents, children or email" className="pl-9" />
        </div>
        <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-48">
          <option value="all">All families</option>
          <option value="active">With active students</option>
          <option value="owing">Owing money</option>
          <option value="overdue">Overdue invoices</option>
        </NativeSelect>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Family</th>
                <th className="px-4 py-2.5 font-medium">Bill payer</th>
                <th className="px-4 py-2.5 font-medium">Children</th>
                <th className="px-4 py-2.5 font-medium">Prefers</th>
                <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                <th className="px-4 py-2.5 text-right font-medium">Lifetime</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(({ f, guardians, kids, owed, overdue, lifetime }) => {
                const payer = guardians.find((g) => g.isBillPayer) ?? guardians[0];
                return (
                  <tr key={f.id} className="hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/app/families/${f.id}`} className="flex items-center gap-2.5 font-medium hover:text-primary">
                        <Avatar name={f.name} size={30} />
                        <span>
                          {f.name}
                          <span className="mt-0.5 flex gap-1">
                            {f.tags.slice(0, 2).map((t) => (
                              <Badge key={t} variant="secondary" className="px-1.5 py-0 text-[10px]">
                                {t}
                              </Badge>
                            ))}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        {payer.firstName} {payer.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{payer.phone}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {kids.map((k) => (
                          <Link key={k.id} href={`/app/students/${k.id}`} className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted">
                            {k.firstName} <span className="text-muted-foreground">{k.yearGroup.replace("Year ", "Y")}</span>
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <ChannelIcon channel={payer.preferredChannel} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular">{owed ? <span className={overdue ? "font-semibold text-rose-600" : ""}>{money(owed)}</span> : <span className="text-muted-foreground">£0</span>}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground tabular">{money(lifetime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
