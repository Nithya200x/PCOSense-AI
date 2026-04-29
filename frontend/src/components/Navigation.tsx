"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, MessageSquare, FileText, HeartPulse } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "AI Assistant", icon: MessageSquare },
    { href: "/report", label: "Analyzer", icon: FileText },
    { href: "/lifestyle", label: "Lifestyle", icon: HeartPulse },
  ];

  return (
    <nav className="glass-card fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-8 w-max">
      <Link href="/" className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
          <Activity size={18} />
        </div>
        <span className="font-bold text-xl gradient-text hidden md:block">PCOSense</span>
      </Link>
      
      <div className="flex items-center gap-6">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive ? "text-blue-600" : "text-slate-500"
              }`}
            >
              <Icon size={18} className={isActive ? "text-blue-600" : ""} />
              <span className="hidden sm:block">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
