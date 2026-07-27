import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="PCOSense Logo"
            width={34}
            height={34}
            className="object-contain grayscale opacity-80"
          />
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              PCOSense AI
            </h2>
            <p className="text-xs text-slate-500">
              Smart support for women’s wellness
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-medium text-slate-500">
          <Link
            href="#"
            className="transition-colors hover:text-blue-600"
          >
            Privacy Policy
          </Link>

          <Link
            href="#"
            className="transition-colors hover:text-blue-600"
          >
            Terms of Service
          </Link>

          <Link
            href="#"
            className="transition-colors hover:text-blue-600"
          >
            Contact
          </Link>
        </div>

        {/* Bottom Text */}
        <p className="flex items-center gap-1 text-sm text-slate-500">
          Made with
          <Heart
            size={16}
            className="fill-red-500 text-red-500"
          />
          for Women’s Health
        </p>
      </div>

      {/* Medical Disclaimer */}
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400 px-6 max-w-4xl mx-auto leading-relaxed">
        <strong>Disclaimer:</strong> PCOSense AI is built for PCOS awareness, lifestyle support, and educational guidance. It is explicitly <strong>not</strong> a diagnostic tool, clinical device, or medical provider. Always consult with a qualified healthcare professional or physician for diagnostic testing, medication management, and medical decisions.
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-100 py-3 text-center text-xs text-slate-400">
        © 2026 PCOSense AI. All rights reserved.
      </div>
    </footer>
  );
}