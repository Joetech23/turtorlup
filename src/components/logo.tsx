import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="tl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f5f63" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#tl-g)" />
      <path d="M13.2 21.4a5.6 5.6 0 1 1 4.6-8.8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M18.8 10.6a5.6 5.6 0 1 1-4.6 8.8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".75" />
      <circle cx="16" cy="16" r="2.1" fill="#fb7b5b" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cn("font-display text-[19px] font-bold tracking-tight", light ? "text-white" : "text-foreground")}>
        tutor<span className="text-[#14b8a6]">lup</span>
      </span>
    </span>
  );
}
