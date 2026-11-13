"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const SUBJECTS = ["Maths", "English", "Science", "11+", "Biology", "Chemistry", "Physics", "Computer Science", "French", "Spanish"];
const INBOUND_KEY = "tutorlup:inbound";

export function EmbedForm({ slug, orgName, brand }: { slug: string; orgName: string; brand: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subjects, setSubjects] = useState<string[]>([]);

  // Tell the parent page (embed.js) how tall we are so the iframe never scrolls.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const post = () => window.parent?.postMessage({ type: "tutorlup:resize", height: el.scrollHeight + 4 }, "*");
    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    const body = Object.fromEntries(fd.entries());
    const res = await fetch(`/api/public/forms/${slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, subjects }) }).catch(() => null);
    if (!res) return setState("error");
    const json = await res.json();
    if (res.status === 422) {
      setErrors(json.error.fields ?? {});
      return setState("idle");
    }
    if (!res.ok) return setState("error");
    // Demo convenience: hand the new enquiry to an open Tutorlup tab on this site.
    try {
      const d = json.data;
      const at = d.created_at;
      const action = {
        type: "enquiry.create",
        at,
        enquiry: { id: d.id, orgId: "org_brightpath", parentName: d.parent_name, email: d.email, phone: d.phone, studentName: d.student_name, yearGroup: d.year_group, subjects: d.subjects, source: d.source, stage: "new", message: d.message, createdAt: at, updatedAt: at, value: 180 },
      };
      const list = JSON.parse(window.localStorage.getItem(INBOUND_KEY) ?? "[]");
      window.localStorage.setItem(INBOUND_KEY, JSON.stringify([...list, action].slice(-20)));
    } catch {
      /* ignore */
    }
    window.parent?.postMessage({ type: "tutorlup:submitted" }, "*");
    setState("done");
  };

  const input = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] outline-none transition focus:border-[var(--b)] focus:ring-4 focus:ring-[var(--b)]/15";
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-rose-600">{errors[k]}</p>;

  return (
    <div ref={ref} style={{ ["--b" as string]: brand }} className="bg-transparent p-1 font-sans text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {state === "done" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="size-12" style={{ color: brand }} />
            <h2 className="mt-3 text-xl font-bold">Thank you!</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-600">We&apos;ve got your enquiry and will be in touch shortly. Keep an eye on your inbox: a confirmation is on its way.</p>
            <p className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">Demo: no real email is sent</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3.5" noValidate>
            <div>
              <h2 className="text-lg font-bold">Book a free trial lesson</h2>
              <p className="text-sm text-slate-500">{orgName} will get back to you within one working day.</p>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Your name
                <input name="parent_name" className={input} placeholder="Parent or guardian" autoComplete="name" />
                {err("parent_name")}
              </label>
              <label className="text-sm font-medium">
                Child&apos;s name
                <input name="student_name" className={input} placeholder="Student" />
                {err("student_name")}
              </label>
              <label className="text-sm font-medium">
                Email
                <input name="email" type="email" className={input} placeholder="you@email.com" autoComplete="email" />
                {err("email")}
              </label>
              <label className="text-sm font-medium">
                Phone / WhatsApp
                <input name="phone" className={input} placeholder="07…" autoComplete="tel" />
              </label>
            </div>
            <label className="text-sm font-medium">
              Year group
              <select name="year_group" className={input} defaultValue="Year 10">
                {Array.from({ length: 12 }, (_, i) => `Year ${i + 2}`).map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
            <div className="text-sm font-medium">
              Subjects
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SUBJECTS.map((s) => {
                  const on = subjects.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSubjects(on ? subjects.filter((x) => x !== s) : [...subjects, s])}
                      className="cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition"
                      style={on ? { background: brand, borderColor: brand, color: "white" } : { borderColor: "#e2e8f0" }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="text-sm font-medium">
              Anything we should know?
              <textarea name="message" rows={3} className={`${input} h-auto py-2.5`} placeholder="Goals, exam dates, best times to call…" />
            </label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <button disabled={state === "sending"} className="h-12 cursor-pointer rounded-xl text-[15px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60" style={{ background: brand }}>
              {state === "sending" ? "Sending…" : "Send enquiry"}
            </button>
            {state === "error" && <p className="text-sm text-rose-600">Something went wrong. Please try again.</p>}
            <p className="text-center text-[11px] text-slate-400">Powered by Tutorlup</p>
          </form>
        )}
      </div>
    </div>
  );
}
