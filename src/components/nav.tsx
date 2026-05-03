"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/trends", label: "Trends" },
  { href: "/library", label: "Library" },
  { href: "/voice", label: "Brand Voice" },
  { href: "/generate", label: "Generate" },
  { href: "/digest", label: "Weekly Digest" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles className="size-4" />
          </span>
          <span>Hook Mining</span>
          <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">for Pixii</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {TABS.map((t) => {
            const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <a
          href="https://github.com/akshayaasd/hook_mining"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground md:inline-flex"
        >
          GitHub →
        </a>
      </div>
    </header>
  );
}
