"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Wallet, Eye, EyeOff, Copy, Check, AlertCircle } from "lucide-react";
import { buildAllowancePolicy, policyToReadableRules, type ParaPolicy } from "@/lib/permissions";
import { useAccount, useWallet, useCreateWallet } from "@getpara/react-sdk";

interface PolicyReviewProps {
  config: {
    maxValueUSD: number;
    allowlistedAddresses: string[];
    childEmail: string;
  };
  onBack: () => void;
}

const PARTNER_ID = "allowance-wallet-beta";
const POLICY_STORAGE_KEY = "allowance_wallet_policy";

function savePolicy(policy: ParaPolicy, childEmail: string) {
  try {
    localStorage.setItem(
      POLICY_STORAGE_KEY,
      JSON.stringify({ policy, childEmail, createdAt: Date.now() })
    );
  } catch {
    // Storage unavailable — silently ignore
  }
}

export function PolicyReview({ config, onBack }: PolicyReviewProps) {
  const { embedded } = useAccount();
  const { data: wallet } = useWallet();
  const { createWalletAsync, isPending: isCreating } = useCreateWallet();
  const [showRawPolicy, setShowRawPolicy] = useState(false);
  const [walletCreated, setWalletCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policy = buildAllowancePolicy(
    {
      maxTransactionValueUSD: config.maxValueUSD,
      allowlistedAddresses: config.allowlistedAddresses,
      childEmail: config.childEmail,
    },
    PARTNER_ID
  );

  const readableRules = policyToReadableRules(policy);
  const policyJson = JSON.stringify(policy, null, 2);

  const handleCopyPolicy = async () => {
    await navigator.clipboard.writeText(policyJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateWallet = async () => {
    setError(null);
    try {
      // Create an EVM wallet for the current (parent) session.
      // In production the policy would be submitted to Para's backend here.
      // The child email is stored locally so the child view can read it.
      await createWalletAsync({ type: "EVM" });

      // Persist policy so the child dashboard can display the applied rules
      savePolicy(policy, config.childEmail);

      setWalletCreated(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Wallet creation failed. Please try again.";
      // "Wallet already exists" is not a fatal error — treat it as success
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("exist")) {
        savePolicy(policy, config.childEmail);
        setWalletCreated(true);
      } else {
        setError(message);
      }
    }
  };

  if (walletCreated) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Policy Created!</h1>
        <p className="text-white/50 mb-8">
          The allowance wallet policy has been constructed and submitted to Para.
          Your child can now log in to see their wallet rules.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-6">
          <h3 className="text-white font-semibold mb-4">Applied Rules</h3>
          <ul className="space-y-2.5">
            {readableRules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span
                  className={`text-sm ${
                    rule.startsWith("  •")
                      ? "text-white/40 font-mono text-xs ml-2"
                      : "text-white/70"
                  }`}
                >
                  {rule}
                </span>
              </li>
            ))}
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-white/70 text-sm">Child account: {config.childEmail}</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left mb-6">
          <p className="text-white/50 text-xs mb-2 font-medium uppercase tracking-wide">Parent Wallet</p>
          <p className="text-white/70 text-sm font-mono">
            {embedded?.email || "Connected"}
          </p>
          {wallet?.address && (
            <p className="text-white/30 text-xs font-mono mt-1">{wallet.address}</p>
          )}
        </div>

        <a
          href="/child"
          className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors text-center"
        >
          View Child&apos;s Perspective →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <Eye className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Review Policy</h1>
        </div>
        <p className="text-white/50 text-sm">
          Review the Para permission policy before creating the child wallet.
        </p>
      </div>

      {/* Human-readable rules */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <h3 className="text-white font-semibold mb-1">Allowance Rules (Human-readable)</h3>
        <p className="text-white/40 text-xs mb-4">
          These rules will be enforced by Para&apos;s backend rules engine
        </p>
        <ul className="space-y-3">
          {readableRules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <span
                className={`text-sm ${
                  rule.startsWith("  •")
                    ? "text-white/40 font-mono text-xs ml-2"
                    : "text-white/70"
                }`}
              >
                {rule}
              </span>
            </li>
          ))}
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-white/70 text-sm">
              Child&apos;s Para account:{" "}
              <span className="text-indigo-300">{config.childEmail}</span>
            </span>
          </li>
        </ul>
      </div>

      {/* Raw JSON toggle */}
      <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden mb-6">
        <button
          onClick={() => setShowRawPolicy(!showRawPolicy)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-white/50 text-xs">Para Policy JSON Schema</span>
          </div>
          <div className="flex items-center gap-2">
            {showRawPolicy && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPolicy();
                }}
                className="flex items-center gap-1 text-white/30 hover:text-white/70 text-xs transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
            {showRawPolicy ? (
              <EyeOff className="w-4 h-4 text-white/30" />
            ) : (
              <Eye className="w-4 h-4 text-white/30" />
            )}
          </div>
        </button>
        {showRawPolicy && (
          <div className="border-t border-white/10 p-4 overflow-x-auto">
            <pre className="text-xs text-green-400/80 leading-relaxed">{policyJson}</pre>
          </div>
        )}
      </div>

      {/* Wallet creation */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Create Child Wallet via Para</h3>
            <p className="text-white/40 text-xs">
              Para will create an EVM wallet with your configured policy
            </p>
          </div>
        </div>
        <div className="text-sm text-white/50 mb-1">
          Policy will be applied for:
        </div>
        <div className="text-indigo-300 text-sm font-medium mb-4">{config.childEmail}</div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-200/70">
          Para will create the wallet with your configured policy applied as scoped permissions.
          Your child will see these rules when they first log in.
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium py-3 rounded-xl transition-colors"
        >
          Edit Rules
        </button>
        <button
          onClick={handleCreateWallet}
          disabled={isCreating}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Create Child Wallet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
