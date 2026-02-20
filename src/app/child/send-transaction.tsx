"use client";

import { useState } from "react";
import { useViemClient } from "@getpara/react-sdk/evm";
import { TransactionReviewDenied, TransactionReviewError, TransactionReviewTimeout } from "@getpara/core-sdk";
import { http, isAddress, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import {
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Shield,
  AlertTriangle,
} from "lucide-react";

type TxStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "success"; hash: string }
  | { state: "blocked"; reason: string; reviewUrl?: string }
  | { state: "error"; reason: string };

const BASE_SEPOLIA_CHAIN_ID = 84532;

/** Classify a Para error using SDK typed classes, then fall back to string matching */
function classifyError(err: unknown): { blocked: boolean; reason: string; reviewUrl?: string } {
  // 1. Typed Para SDK errors — the cleanest path
  if (err instanceof TransactionReviewDenied) {
    return { blocked: true, reason: "Para blocked this transaction: policy violation (TransactionReviewDenied)" };
  }
  if (err instanceof TransactionReviewTimeout) {
    return {
      blocked: true,
      reason: "Transaction review timed out — Para is enforcing a policy review.",
      reviewUrl: (err as TransactionReviewTimeout).transactionReviewUrl,
    };
  }
  if (err instanceof TransactionReviewError) {
    return {
      blocked: true,
      reason: `Para transaction review required: ${err.message}`,
      reviewUrl: (err as TransactionReviewError).transactionReviewUrl,
    };
  }

  // 2. String-based fallback for unexpected error shapes
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  const isBlocked =
    lower.includes("denied") ||
    lower.includes("blocked") ||
    lower.includes("policy") ||
    lower.includes("permission") ||
    lower.includes("403") ||
    lower.includes("forbidden") ||
    lower.includes("review") ||
    lower.includes("pendingtransactionid");

  // Try to trim JSON noise
  let reason = msg;
  const jsonStart = msg.indexOf("{");
  if (jsonStart > 0) reason = msg.slice(0, jsonStart).trim();
  if (!reason) reason = "Transaction was rejected";

  return { blocked: isBlocked, reason };
}

export function SendTransaction({ walletAddress, maxUSD }: { walletAddress: string; maxUSD: number }) {
  const [to, setTo] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [status, setStatus] = useState<TxStatus>({ state: "idle" });

  // Para-backed viem WalletClient for Base Sepolia testnet
  const { viemClient, isLoading: clientLoading } = useViemClient({
    walletClientConfig: {
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    },
  });

  const canSend = !clientLoading && !!viemClient;

  const handleSend = async () => {
    if (!viemClient) return;

    const toAddr = to.trim();
    const amount = ethAmount.trim();

    if (!isAddress(toAddr)) {
      setStatus({ state: "error", reason: "Invalid recipient address." });
      return;
    }

    let valueBig: bigint;
    try {
      valueBig = parseEther(amount);
    } catch {
      setStatus({ state: "error", reason: "Invalid ETH amount." });
      return;
    }

    if (valueBig === BigInt(0)) {
      setStatus({ state: "error", reason: "Amount must be greater than 0." });
      return;
    }

    setStatus({ state: "pending" });

    try {
      // All signing goes through Para's MPC infrastructure.
      // Para's policy engine evaluates VALUE and chainId before signing.
      // Chain: Base Sepolia (84532) — matches the policy chainId.
      const hash = await viemClient.sendTransaction({
        to: toAddr as `0x${string}`,
        value: valueBig,
        chain: baseSepolia,
      });

      setStatus({ state: "success", hash });
    } catch (err: unknown) {
      const { blocked, reason, reviewUrl } = classifyError(err);
      if (blocked) {
        setStatus({ state: "blocked", reason, reviewUrl });
      } else {
        setStatus({ state: "error", reason });
      }
    }
  };

  const handleReset = () => {
    setStatus({ state: "idle" });
    setTo("");
    setEthAmount("");
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <Send className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold">Send Transaction</h2>
          <p className="text-white/40 text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Enforced by Para · Base Sepolia testnet only
          </p>
        </div>
      </div>

      {/* Wallet not ready */}
      {clientLoading && (
        <div className="flex items-center gap-2 text-white/40 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Initializing Para wallet signer…
        </div>
      )}

      {!clientLoading && !viemClient && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Para wallet signer is not available. Make sure you&apos;re logged in with a Para
            embedded wallet.
          </span>
        </div>
      )}

      {/* Success */}
      {status.state === "success" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-300 font-medium text-sm">Transaction submitted</p>
              <p className="text-white/50 text-xs mt-1">
                Para signed and broadcast the transaction. It is within your allowed policy.
              </p>
              <a
                href={`https://sepolia.basescan.org/tx/${status.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 text-xs mt-2 hover:underline"
              >
                View on Base Sepolia Basescan <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-white/30 text-xs font-mono mt-1 break-all">{status.hash}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Send another
          </button>
        </div>
      )}

      {/* Blocked by Para */}
      {status.state === "blocked" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium text-sm">Blocked by Para</p>
              <p className="text-white/50 text-xs mt-1">
                Para&apos;s policy engine rejected this transaction. It violates one or more of
                your wallet rules (e.g. amount above ${maxUSD} USD or wrong chain).
              </p>
              <p className="text-red-300/70 text-xs font-mono mt-2 break-all">{status.reason}</p>
              {status.reviewUrl && (
                <a
                  href={status.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-red-400 text-xs mt-2 hover:underline"
                >
                  Review transaction <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Generic error */}
      {status.state === "error" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <XCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Transaction failed</p>
              <p className="text-red-300/70 text-xs font-mono mt-1 break-all">{status.reason}</p>
            </div>
          </div>
          <button
            onClick={() => setStatus({ state: "idle" })}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Form */}
      {canSend && (status.state === "idle" || status.state === "pending") && (
        <div className="space-y-4">
          {/* From wallet */}
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">From (your wallet)</label>
            <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-white/40 text-xs font-mono truncate">{walletAddress}</p>
            </div>
          </div>

          {/* To address */}
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">Recipient address</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              disabled={status.state === "pending"}
              className="w-full bg-black/30 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">
              Amount (ETH){" "}
              <span className="text-white/30">— Para enforces max ~${maxUSD} USD value</span>
            </label>
            <input
              type="number"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="0.001"
              min="0"
              step="0.0001"
              disabled={status.state === "pending"}
              className="w-full bg-black/30 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* Chain indicator */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-white/30 text-xs">Base Sepolia testnet (chainId: {BASE_SEPOLIA_CHAIN_ID})</span>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={status.state === "pending" || !to.trim() || !ethAmount.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {status.state === "pending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Para is processing…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send via Para
              </>
            )}
          </button>

          {/* Policy enforcement reminder */}
          <p className="text-white/20 text-xs text-center">
            Para evaluates every transaction against your wallet policy before signing.
            No local enforcement — all checks are server-side.
          </p>
        </div>
      )}
    </div>
  );
}
