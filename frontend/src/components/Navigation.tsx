"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  HeartPulse,
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
      href: "/lifestyle",
      label: "Lifestyle",
      icon: HeartPulse,
    },
  ];

  return (
    <nav className="glass-card fixed top-4 left-1/2 z-50 flex w-[95%] max-w-6xl -translate-x-1/2 items-center justify-between px-6 py-3">
      
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="PCOSense Logo"
          width={32}
          height={32}
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
            className="font-medium text-blue-600 transition hover:text-blue-700"
          >
            Log In
          </Link>

          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 px-4 py-1.5 font-bold text-white transition-all hover:shadow-lg"
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}