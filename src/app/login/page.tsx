import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/data/config";
import { MagicLinkForm } from "./magic-link-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  const supabase = isSupabaseConfigured();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-12">
          <div>
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your tutoring workspace.</p>
          </div>
          {supabase ? (
            <MagicLinkForm />
          ) : (
            <div className="rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
              This copy of Tutorloop is running in <strong className="text-foreground">demo mode</strong>, so there are no user accounts yet.
              Jump straight into the sample workspace below.
            </div>
          )}
          <div className="relative text-center text-xs text-muted-foreground before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-border">
            <span className="relative bg-background px-2">or</span>
          </div>
          <Button asChild size="lg" variant={supabase ? "outline" : "default"}>
            <a href="/demo">
              Try the live demo (no password) <ArrowRight />
            </a>
          </Button>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute -top-40 -right-40 size-[520px] rounded-full bg-[#14b8a6]/25 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-md text-2xl leading-snug font-semibold font-display">
            “Our trial-to-enrolment rate went up the month we switched on the follow-up reminders. Nobody slips through the cracks now.”
          </blockquote>
          <p className="mt-4 text-sm text-white/60">Example customer story, used for illustration</p>
        </div>
      </div>
    </div>
  );
}
