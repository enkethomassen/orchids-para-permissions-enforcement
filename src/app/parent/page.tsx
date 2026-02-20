"use client";

import { useState } from "react";
import { useAccount, useWallet, setIsOpen, useLogout } from "@getpara/react-sdk";
import { Shield, ArrowLeft, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { PolicyConfig } from "./policy-config";
import { PolicyReview } from "./policy-review";

type Step = "auth" | "configure" | "review";

export default function ParentPage() {
  const { isConnected, isLoading, embedded } = useAccount();
  const { data: wallet } = useWallet();
  const { logout } = useLogout();
  const [step, setStep] = useState<Step>("auth");
  const [policyConfig, setPolicyConfig] = useState<{
    maxValueUSD: number;
    allowlistedAddresses: string[];
    childEmail: string;
  } | null>(null);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  const handleProceedToConfigure = () => {
    setStep("configure");
  };

  const handleConfigureSubmit = (config: {
    maxValueUSD: number;
    allowlistedAddresses: string[];
    childEmail: string;
  }) => {
    setPolicyConfig(config);
    setStep("review");
  };

  const handleBack = () => {
    if (step === "configure") setStep("auth");
    else if (step === "review") setStep("configure");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-semibold">AllowanceWallet</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <>
                <span className="text-white/40 text-sm hidden sm:block">
                  {embedded?.email || (wallet?.address ? wallet.address.slice(0, 8) + "..." : "Connected")}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            )}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1">
              <span className="text-indigo-300 text-xs font-medium">Parent</span>
            </div>
          </div>
        </div>
      </header>

      {/* Steps indicator */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            {[
              { id: "auth", label: "Sign In" },
              { id: "configure", label: "Configure Rules" },
              { id: "review", label: "Review & Create" },
            ].map((s, i) => {
              const stepOrder = ["auth", "configure", "review"];
              const currentIdx = stepOrder.indexOf(step);
              const sIdx = stepOrder.indexOf(s.id);
              const isActive = step === s.id;
              const isDone = sIdx < currentIdx;

              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      isActive
                        ? "text-white"
                        : isDone
                        ? "text-indigo-400"
                        : "text-white/30"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : isDone
                          ? "bg-indigo-500/30 text-indigo-300"
                          : "bg-white/10 text-white/30"
                      }`}
                    >
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 2 && (
                    <ChevronRight className="w-3 h-3 text-white/20" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {step === "auth" && (
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Parent Sign In</h1>
            <p className="text-white/50 mb-8">
              Sign in with Para to create a constrained allowance wallet for your child.
              Use a test email ending in{" "}
              <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">@test.getpara.com</code>{" "}
              with verification code{" "}
              <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">123456</code>.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-white/40">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            ) : isConnected ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-emerald-300 text-sm font-medium">Signed in with Para</span>
                  </div>
                  {embedded?.email && (
                    <p className="text-white/60 text-sm">{embedded.email}</p>
                  )}
                  {wallet?.address && (
                    <p className="text-white/40 text-xs font-mono mt-1">
                      {wallet.address}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleProceedToConfigure}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Configure Child Wallet Rules →
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenModal}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Sign In with Para
              </button>
            )}
          </div>
        )}

        {step === "configure" && isConnected && (
          <PolicyConfig
            onSubmit={handleConfigureSubmit}
            onBack={handleBack}
          />
        )}

        {step === "review" && isConnected && policyConfig && (
          <PolicyReview
            config={policyConfig}
            onBack={handleBack}
          />
        )}

        {/* Not connected guard for later steps */}
        {(step === "configure" || step === "review") && !isConnected && (
          <div className="text-center text-white/40 py-12">
            <p>
              Session expired.{" "}
              <Link
                href="/parent"
                className="text-indigo-400 hover:underline"
                onClick={() => setStep("auth")}
              >
                Sign in again
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
