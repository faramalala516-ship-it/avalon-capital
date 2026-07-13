import Link from "next/link";
import { BadgeDollarSign, Bot, Landmark, LayoutDashboard, Radar } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/market-intelligence", label: "Sentiment", icon: Radar },
  { href: "/macro-dashboard", label: "Policy", icon: Landmark },
  { href: "/chatbot-ia", label: "Agents IA", icon: Bot },
  { href: "/tarifs", label: "Tarifs", icon: BadgeDollarSign }
];

export function AppNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-obsidian/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-md border border-bullion/40 bg-bullion/10 shadow-glow">
            <svg viewBox="0 0 42 42" aria-hidden="true" className="h-7 w-7">
              <path d="M21 5 34 34h-5.6l-2.7-6.6h-9.6L12.4 34H7L21 5Z" fill="none" stroke="currentColor" strokeWidth="2.4" className="text-bullion" />
              <path d="M17.2 22.6h7.6L21 13.1l-3.8 9.5Z" fill="currentColor" className="text-platinum" />
            </svg>
          </span>
          <span className="text-sm font-semibold uppercase tracking-[.22em] text-platinum">
            Avalon Capital
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <AuthControls />
      </div>
    </header>
  );
}
