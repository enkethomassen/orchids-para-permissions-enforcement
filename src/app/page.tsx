"use client";

import Link from "next/link";
import { Shield, Users, ArrowRight, Lock, Coins, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">AllowanceWallet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              Powered by Para Permissions
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-2 mb-8">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          <span className="text-indigo-300 text-sm">Beta — Using Para SDK + Real Permissions</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Constrained Crypto Wallets
          <br />
          <span className="text-indigo-400">for Kids</span>
        </h1>

        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-12">
          Parents create scoped wallets with real Para permissions. Children get
          allowances with enforced limits — no overrides, no workarounds.
        </p>

        {/* Role cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {/* Parent card */}
          <Link href="/parent" className="group">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-left hover:bg-white/8 hover:border-indigo-500/50 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">I&apos;m a Parent</h2>
              <p className="text-white/50 text-sm mb-6">
                Log in with Para, configure allowance rules, and create a constrained wallet for your child.
              </p>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium group-hover:gap-3 transition-all">
                Get started <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Child card */}
          <Link href="/child" className="group">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-left hover:bg-white/8 hover:border-emerald-500/50 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">I&apos;m a Child</h2>
              <p className="text-white/50 text-sm mb-6">
                Log in with Para to see your allowance wallet and the rules that apply to your account.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all">
                View my wallet <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-white/40 text-sm font-medium uppercase tracking-widest mb-8">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: <Shield className="w-5 h-5 text-indigo-400" />,
                title: "Para Authentication",
                desc: "Both parent and child authenticate through Para's secure embedded wallet modal — real accounts, real sessions.",
              },
              {
                icon: <Lock className="w-5 h-5 text-violet-400" />,
                title: "Scoped Permissions",
                desc: "Parent configures a Para policy with chain, value, and address constraints. Policy is submitted to Para's backend.",
              },
              {
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                title: "Enforced by Para",
                desc: "Para's rules engine enforces all restrictions. The child's wallet cannot exceed limits or send to unlisted addresses.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h4 className="text-white font-medium mb-2">{item.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Policy preview */}
        <div className="max-w-2xl mx-auto mt-16 bg-black/30 border border-white/10 rounded-2xl p-6 text-left">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white/30 text-xs ml-2">Para Policy Schema</span>
          </div>
          <pre className="text-xs text-green-400/80 overflow-x-auto leading-relaxed">{`{
  "partnerId": "allowance-wallet",
  "scopes": [{
    "name": "Allowance Transfer",
    "required": true,
    "permissions": [{
      "effect": "ALLOW",
        "chainId": "84532",    // Base Sepolia testnet
      "type": "TRANSFER",
      "conditions": [
        { "resource": "VALUE",
          "comparator": "EQUALS",
          "reference": 15 },  // max $15 USD
        { "resource": "TO_ADDRESS",
          "comparator": "INCLUDED_IN",
          "reference": ["0x..."] }
      ]
    }, {
      "effect": "DENY",
      "type": "DEPLOY_CONTRACT"
    }]
  }]
}`}</pre>
        </div>
      </div>
    </main>
  );
}
