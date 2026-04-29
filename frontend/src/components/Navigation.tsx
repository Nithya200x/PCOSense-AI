"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  HeartPulse,
  History,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/chat",
      label: "AI Assistant",
      icon: MessageSquare,
    },
    {
      href: "/report",
      label: "Analyzer",
      icon: FileText,
    },
    {
      href: "/history",
      label: "History",
      icon: History,
    },
    {
      href: "/lifestyle",
      label: "Lifestyle",
      icon: HeartPulse,
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="PCOSense Logo"
          width={48}
          height={48}
          className="object-contain"
        />
        <span className="hidden text-xl font-bold gradient-text md:block">
          PCOSense
        </span>
      </Link>

      {/* Logged In Navigation */}
      {user ? (
        <div className="flex items-center gap-5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-blue-600"
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:block">{link.label}</span>
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-all hover:text-red-500"
          >
            <LogOut size={18} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      ) : (
        /* Guest Navigation */
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            Log In
          </Link>

          <Link
            href="/signup"
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-blue-500/30"
          >
            Sign Up
          </Link>
        </div>
      )}
      </div>
    </nav>
  );
}