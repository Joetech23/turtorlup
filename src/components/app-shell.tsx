"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  GraduationCap,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Code2,
  TrendingUp,
  UserRound,
  Users,
  Workflow,
  X,
  Eye,
  ListChecks,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { useWorkspace } from "@/lib/store/provider";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { CommandSearch } from "@/components/command-search";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: (n: Counts) => number | undefined };
type Counts = { newEnquiries: number; unread: number; openTasks: number };

const NAV: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/enquiries", label: "Enquiries", icon: Sparkles, badge: (c) => c.newEnquiries || undefined },
      { href: "/app/inbox", label: "Inbox", icon: Inbox, badge: (c) => c.unread || undefined },
      { href: "/app/tasks", label: "Tasks", icon: ListChecks, badge: (c) => c.openTasks || undefined },
    ],
  },
  {
    heading: "People",
    items: [
      { href: "/app/families", label: "Families", icon: Home },
      { href: "/app/students", label: "Students", icon: GraduationCap },
      { href: "/app/tutors", label: "Tutors", icon: UserRound },
    ],
  },
  {
    heading: "Teaching",
    items: [
      { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/app/progress", label: "Progress & goals", icon: TrendingUp },
    ],
  },
  {
    heading: "Business",
    items: [
      { href: "/app/billing", label: "Billing", icon: CreditCard },
      { href: "/app/automations", label: "Automations", icon: Workflow },
      { href: "/app/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    heading: "Connect",
    items: [
      { href: "/app/portal", label: "Parent portal", icon: Eye },
      { href: "/app/website", label: "Website & API", icon: Code2 },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLinks({ counts, onNavigate }: { counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5 px-3">
      {NAV.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.heading && <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">{group.heading}</div>}
          {group.items.map((item) => {
            const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            const badge = item.badge?.(counts);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className={cn("size-[17px]", active ? "text-[#2dd4bf]" : "text-sidebar-muted group-hover:text-sidebar-foreground")} />
                <span className="flex-1">{item.label}</span>
                {badge ? <span className="rounded-full bg-coral px-1.5 py-px text-[11px] font-semibold text-white tabular">{badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ws, reset } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const counts = useMemo<Counts>(
    () => ({
      newEnquiries: ws.enquiries.filter((e) => e.stage === "new").length,
      unread: new Set(ws.messages.filter((m) => m.status === "received").map((m) => m.familyId ?? m.enquiryId)).size,
      openTasks: ws.tasks.filter((t) => !t.done).length,
    }),
    [ws.enquiries, ws.messages, ws.tasks],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async () => {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/");
  };

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6">
        <Link href="/app" onClick={onNavigate}>
          <Logo light />
        </Link>
      </div>
      <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl bg-sidebar-accent/80 px-3 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: ws.org.brandColour }}>
          {ws.org.name[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">{ws.org.name}</div>
          <div className="text-[11px] text-sidebar-muted">{ws.org.plan} plan</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
        <NavLinks counts={counts} onNavigate={onNavigate} />
      </div>
      {ws.mode === "demo" && (
        <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3 text-[12px] leading-relaxed text-sidebar-foreground/80">
          <div className="mb-1 font-semibold text-white">You&apos;re in the live demo</div>
          Click around freely. Messages are simulated and nothing is really sent.
          <button onClick={reset} className="mt-2 flex cursor-pointer items-center gap-1.5 font-medium text-[#2dd4bf] hover:underline">
            <RotateCcw className="size-3.5" /> Reset demo data
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh" style={{ ["--brand" as string]: ws.org.brandColour }}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar()}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl animate-in slide-in-from-left">
            {sidebar(() => setMobileOpen(false))}
            <button className="absolute top-4 right-3 cursor-pointer rounded-md p-1.5 text-white/70 hover:bg-white/10" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <button className="-ml-1 cursor-pointer rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Link href="/app" className="lg:hidden">
            <LogoMark size={26} />
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs hover:border-ring/40 sm:max-w-sm"
          >
            <Search className="size-4" />
            <span className="flex-1 truncate text-left">Search families, students, tutors…</span>
            <span className="hidden rounded border bg-muted px-1.5 font-mono text-[11px] sm:inline">Ctrl K</span>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/app/inbox" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Notifications">
              <Bell className="size-5" />
              {counts.unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-coral ring-2 ring-background" />}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-lg p-1 pr-2 outline-none hover:bg-muted">
                <Avatar name="Funmi Adeyemi" hue={180} size={30} />
                <span className="hidden text-sm font-medium sm:block">Funmi</span>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold text-foreground">Funmi Adeyemi</div>
                  <div className="font-normal">Owner · {ws.org.name}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/app/settings")}>
                  <Settings /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push("/app/settings?tab=team")}>
                  <Users /> Team
                </DropdownMenuItem>
                {ws.mode === "demo" && (
                  <DropdownMenuItem onSelect={reset}>
                    <RotateCcw /> Reset demo data
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
