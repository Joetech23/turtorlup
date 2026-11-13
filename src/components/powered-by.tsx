import { cn } from "@/lib/utils";

/** "Powered by Eaglescroft" credit, using the official Eaglescroft eagle mark and navy. */
export function PoweredBy({ className, light }: { className?: string; light?: boolean }) {
  return (
    <a
      href="https://eaglescroft.com.ng"
      target="_blank"
      rel="noopener"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition hover:shadow-sm",
        light ? "border-white/20 bg-white/10 text-white/80" : "border-[#001E60]/15 bg-white text-[#48526E]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand mark */}
      <img src={light ? "/eaglescroft-eagle-white.png" : "/eaglescroft-eagle-navy.png"} alt="" width={24} height={16} className="h-4 w-auto" />
      <span>
        Powered by <span className={cn("font-semibold", light ? "text-white" : "text-[#001E60]")}>Eaglescroft</span>
      </span>
    </a>
  );
}
