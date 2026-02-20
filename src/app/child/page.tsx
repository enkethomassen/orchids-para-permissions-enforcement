"use client";

import { useState, useEffect } from "react";
import { useAccount, useWallet, setIsOpen, useLogout } from "@getpara/react-sdk";
import { useViemClient } from "@getpara/react-sdk/evm";
import { http } from "viem";
import { baseSepolia } from "viem/chains";
import { Coins, ArrowLeft, Shield, Lock, CheckCircle2, AlertCircle, LogOut, Info, Wifi, WifiOff, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { buildAllowancePolicy, type ParaPolicy } from "@/lib/permissions";
import { SendTransaction } from "./send-transaction";

const POLICY_STORAGE_KEY = "allowance_wallet_policy";
const DEFAULT_MAX_USD = 15;
const PARTNER_ID = "allowance-wallet-beta";

interface StoredPolicyData {
  policy: ParaPolicy;
  childEmail: string;
  createdAt: number;
}

function loadStoredPolicy(): StoredPolicyData | null {
  try {
    const raw = localStorage.getItem(POLICY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPolicyData;
  } catch {
    return null;
  }
}

export default function ChildPage() {
  const { isConnected, isLoading, embedded } = useAccount();
  const { data: wallet } = useWallet();
  const { logout } = useLogout();
  const { viemClient, isLoading: signerLoading } = useViemClient({
    walletClientConfig: {
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    },
  });
  const [showDetails, setShowDetails] = useState(false);
  const [storedData, setStoredData] = useState<StoredPolicyData | null>(null);

  // Load policy from localStorage after mount (client-only)
  useEffect(() => {
    setStoredData(loadStoredPolicy());
  }, []);

  // Use stored policy if available, otherwise fall back to the default demo policy
  const activePolicy: ParaPolicy =
    storedData?.policy ??
    buildAllowancePolicy(
      {
        maxTransactionValueUSD: DEFAULT_MAX_USD,
        allowlistedAddresses: [],
        childEmail: embedded?.email ?? "child@test.getpara.com",
      },
      PARTNER_ID
    );

  const policyJson = JSON.stringify(activePolicy, null, 2);

  // Derive display values from the active policy
  const transferScope = activePolicy.scopes.find((s) =>
    s.permissions.some((p) => p.effect === "ALLOW" && p.type === "TRANSFER")
  );
  const transferPerm = transferScope?.permissions.find(
    (p) => p.effect === "ALLOW" && p.type === "TRANSFER"
  );
  const valueCondition = transferPerm?.conditions.find(
    (c) => c.resource === "VALUE" && c.comparator === "EQUALS"
  );
  const addressCondition = transferPerm?.conditions.find(
    (c) => c.resource === "TO_ADDRESS" && c.comparator === "INCLUDED_IN"
  );
  const maxUSD = valueCondition ? Number(valueCondition.reference) : DEFAULT_MAX_USD;
  const allowedAddresses = Array.isArray(addressCondition?.reference)
    ? (addressCondition.reference as string[])
    : [];

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-semibold">AllowanceWallet</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <>
                <span className="text-white/40 text-sm hidden sm:block">
                  {embedded?.email ||
                    (wallet?.address ? wallet.address.slice(0, 8) + "..." : "Connected")}
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
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
              <span className="text-emerald-300 text-xs font-medium">Child</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-white/40 py-20">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : !isConnected ? (
          /* Login screen */
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Coins className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Your Allowance Wallet</h1>
            <p className="text-white/50 mb-8">
              Sign in with Para to view your wallet and see the rules your parent has set.
              Use a test email ending in{" "}
              <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">
                @test.getpara.com
              </code>{" "}
              with code{" "}
              <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">123456</code>.
            </p>
            <button
              onClick={handleOpenModal}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Sign In with Para
            </button>
          </div>
        ) : (
          /* Logged-in view */
          <div className="max-w-2xl mx-auto">
            {/* Welcome */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Your Allowance Wallet</h1>
              <p className="text-white/50 text-sm">
                Signed in as{" "}
                <span className="text-emerald-300">{embedded?.email || "Connected"}</span>
              </p>
              {wallet?.address && (
                <p className="text-white/30 text-xs font-mono mt-1">{wallet.address}</p>
              )}
            </div>

            {/* First-login / policy notice */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-emerald-300 font-medium text-sm mb-1">
                  Welcome! Your wallet has rules
                </h3>
                <p className="text-white/50 text-sm">
                  Your parent has set up this wallet with Para permissions. The rules below are
                  enforced by Para&apos;s backend — they cannot be bypassed.
                </p>
              </div>
            </div>

            {/* Policy source indicator */}
            {storedData ? (
              <div className="flex items-center gap-2 mb-4 px-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-indigo-300/70 text-xs">
                  Policy set by parent on{" "}
                  {new Date(storedData.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {storedData.childEmail && ` for ${storedData.childEmail}`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4 px-1">
                <Info className="w-3.5 h-3.5 text-white/30" />
                <span className="text-white/30 text-xs">
                  Showing default demo policy — have a parent configure rules first.
                </span>
              </div>
            )}

            {/* Rules */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Your Wallet Rules</h2>
                  <p className="text-white/40 text-xs">Enforced by Para on every transaction</p>
                </div>
              </div>

              <ul className="space-y-4">
                {/* Network — always Base */}
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Base Sepolia Testnet Only</p>
                    <p className="text-white/40 text-xs">
                      All transactions are restricted to Base Sepolia testnet (chainId: 84532)
                    </p>
                  </div>
                </li>

                {/* Max value */}
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-400 text-xs font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Max ${maxUSD} Per Transaction
                    </p>
                    <p className="text-white/40 text-xs">
                      You cannot send more than ${maxUSD} USD in a single transaction
                    </p>
                  </div>
                </li>

                {/* Transfers only */}
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Transfers Only</p>
                    <p className="text-white/40 text-xs">
                      Only ETH/token transfers are permitted — no smart contract calls
                    </p>
                  </div>
                </li>

                {/* Allowlisted addresses (if any) */}
                {allowedAddresses.length > 0 ? (
                  <li className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium mb-1">
                        Approved Recipients Only ({allowedAddresses.length})
                      </p>
                      <p className="text-white/40 text-xs mb-2">
                        You can only send to the following addresses
                      </p>
                      <div className="space-y-1">
                        {allowedAddresses.map((addr) => (
                          <p key={addr} className="text-white/50 text-xs font-mono truncate">
                            {addr}
                          </p>
                        ))}
                      </div>
                    </div>
                  </li>
                ) : (
                  <li className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Any Recipient Allowed</p>
                      <p className="text-white/40 text-xs">No address allowlist — send to anyone</p>
                    </div>
                  </li>
                )}

                {/* Blocked: contract deployments */}
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">No Contract Deployments</p>
                    <p className="text-white/40 text-xs">Deploying smart contracts is blocked</p>
                  </div>
                </li>
              </ul>
            </div>

              {/* Wallet accessibility status */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-3">Wallet Status</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {/* Real wallet */}
                  <div className="space-y-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto bg-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-white text-xs font-medium">Real Wallet</p>
                    <p className="text-white/30 text-xs">Para-managed</p>
                  </div>
                  {/* Signer */}
                  <div className="space-y-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto ${signerLoading ? "bg-amber-500/20" : viemClient ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                      {signerLoading ? (
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      ) : viemClient ? (
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <p className="text-white text-xs font-medium">Signer</p>
                    <p className={`text-xs ${signerLoading ? "text-amber-400/70" : viemClient ? "text-emerald-400/70" : "text-red-400/70"}`}>
                      {signerLoading ? "Loading…" : viemClient ? "Ready" : "Unavailable"}
                    </p>
                  </div>
                  {/* Transactions */}
                  <div className="space-y-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto ${viemClient ? "bg-emerald-500/20" : "bg-white/10"}`}>
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-white text-xs font-medium">Transactions</p>
                    <p className={`text-xs ${viemClient ? "text-emerald-400/70" : "text-white/30"}`}>
                      {viemClient ? "Enabled" : "Waiting…"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Send Transaction */}
              {wallet?.address && (
                <div className="mb-4">
                  <SendTransaction walletAddress={wallet.address} maxUSD={maxUSD} />
                </div>
              )}

              {/* Raw Para Policy toggle */}
              <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden mb-6">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-white/50 text-xs">
                      Raw Para Policy (read-only) — Click to {showDetails ? "hide" : "show"}
                    </span>
                  </div>
                  <Shield className="w-4 h-4 text-white/30" />
                </button>
                {showDetails && (
                  <div className="border-t border-white/10 p-4 overflow-x-auto">
                    <p className="text-white/20 text-xs mb-2">Informational only — enforced server-side by Para</p>
                    <pre className="text-xs text-green-400/80 leading-relaxed">{policyJson}</pre>
                  </div>
                )}
              </div>

              {/* Summary chips */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Transfers</p>
                  <p className="text-white/40 text-xs">Up to ${maxUSD} USD</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <Lock className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Deploy Contracts</p>
                  <p className="text-white/40 text-xs">Blocked</p>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
