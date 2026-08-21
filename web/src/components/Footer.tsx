import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#1A2E45]/80 bg-[#050D1A] pt-12 pb-8 text-slate-400 text-xs font-body">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[#1A2E45]/70">
          
          {/* Brand & Company Details (7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"
                style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
              >
                🚕
              </div>
              <div>
                <span className="font-display text-2xl font-black text-white tracking-tight">
                  Cab<span className="text-cyan-400">8</span>
                </span>
                <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest -mt-1 font-semibold">
                  Powered by OrderMint
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Smart Mobility. Better Rides. Connecting passengers directly with verified local drivers across Himachal Pradesh with 0% commission.
            </p>

            {/* Micro details pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 max-w-lg">
              <div className="bg-[#0D1B2E]/60 border border-[#1A2E45] rounded-lg p-2.5">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Founder &amp; Owner</span>
                <span className="text-slate-200 font-semibold">Ritesh Grover</span>
              </div>
              <div className="bg-[#0D1B2E]/60 border border-[#1A2E45] rounded-lg p-2.5">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Headquarters</span>
                <span className="text-slate-200 font-medium">Mandi, HP – 175001</span>
              </div>
              <div className="bg-[#0D1B2E]/60 border border-[#1A2E45] rounded-lg p-2.5 font-mono">
                <span className="text-slate-500 block text-[10px] uppercase">GSTIN</span>
                <span className="text-cyan-400 font-semibold">02BMAPG7310Q2Z6</span>
              </div>
              <div className="bg-[#0D1B2E]/60 border border-[#1A2E45] rounded-lg p-2.5 font-mono">
                <span className="text-slate-500 block text-[10px] uppercase">Direct Helpline</span>
                <a href="tel:+918679800074" className="text-cyan-400 hover:underline font-semibold flex items-center gap-1">
                  <span>+91-8679800074</span>
                </a>
              </div>
            </div>
          </div>

          {/* Legal & Policy Links (5 Cols) */}
          <div className="md:col-span-5 space-y-3 md:pl-6">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
              Legal &amp; Policy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                { href: "/legal", label: "Legal Hub" },
                { href: "/legal/terms", label: "Terms & Conditions" },
                { href: "/legal/privacy", label: "Privacy Policy" },
                { href: "/legal/disclaimer", label: "Platform Disclaimer" },
                { href: "/legal/partner-agreement", label: "Driver Partner Terms" },
                { href: "/legal/refund", label: "Refund Policy" },
                { href: "/legal/contact", label: "Contact & Grievance" },
              ].map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group text-xs"
                  >
                    <span className="text-slate-600 group-hover:text-cyan-400 transition-colors">›</span>
                    <span>{item.label}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>© {new Date().getFullYear()} CAB8.in · OrderMint.in · All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5 flex-wrap justify-center font-medium">
            <Link href="/legal/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <span className="text-slate-700">·</span>
            <Link href="/legal/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <span className="text-slate-700">·</span>
            <Link href="/legal/disclaimer" className="hover:text-slate-300 transition-colors">Disclaimer</Link>
            <span className="text-slate-700">·</span>
            <Link href="/legal/refund" className="hover:text-slate-300 transition-colors">Refund Policy</Link>
            <span className="text-slate-700">·</span>
            <Link href="/legal/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
