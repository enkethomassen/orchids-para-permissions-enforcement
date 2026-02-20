"use client";

import { useState } from "react";
import { ArrowLeft, Plus, X, Settings, AlertCircle } from "lucide-react";

interface PolicyConfigProps {
  onSubmit: (config: {
    maxValueUSD: number;
    allowlistedAddresses: string[];
    childEmail: string;
  }) => void;
  onBack: () => void;
}

export function PolicyConfig({ onSubmit, onBack }: PolicyConfigProps) {
  const [maxValueUSD, setMaxValueUSD] = useState(15);
  const [allowlistedAddresses, setAllowlistedAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValidAddress = (addr: string) =>
    /^0x[0-9a-fA-F]{40}$/.test(addr);

  const addAddress = () => {
    if (!newAddress) return;
    if (!isValidAddress(newAddress)) {
      setErrors((e) => ({ ...e, address: "Must be a valid 0x Ethereum address" }));
      return;
    }
    if (allowlistedAddresses.includes(newAddress)) {
      setErrors((e) => ({ ...e, address: "Address already added" }));
      return;
    }
    setAllowlistedAddresses((prev) => [...prev, newAddress]);
    setNewAddress("");
    setErrors((e) => { const n = { ...e }; delete n.address; return n; });
  };

  const removeAddress = (addr: string) => {
    setAllowlistedAddresses((prev) => prev.filter((a) => a !== addr));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!childEmail) newErrors.childEmail = "Required";
    else if (!childEmail.includes("@")) newErrors.childEmail = "Invalid email";
    if (maxValueUSD < 1) newErrors.maxValue = "Minimum $1";
    if (maxValueUSD > 1000) newErrors.maxValue = "Maximum $1000";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({ maxValueUSD, allowlistedAddresses, childEmail });
  };

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
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Configure Allowance Rules</h1>
        </div>
        <p className="text-white/50 text-sm">
          These rules will be encoded in a Para permission policy and submitted to Para&apos;s backend for enforcement.
        </p>
      </div>

      {/* Architecture note */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-indigo-200/70 leading-relaxed">
            <strong className="text-indigo-300">Para Permissions Architecture:</strong> The rules below will be
            constructed as a <code className="bg-indigo-900/50 px-1 rounded">ParaPolicy</code> with scopes,
            permissions, and static conditions — exactly matching Para&apos;s schema. All enforcement
            is handled server-side by Para&apos;s rules engine.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chain — fixed to Base */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium text-sm mb-1">Network</h3>
              <p className="text-white/40 text-xs">Transactions are restricted to this chain only</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Base Sepolia testnet (chainId: 84532)</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30 font-mono">
            permission.chainId = &quot;84532&quot;
          </div>
        </div>

        {/* Max transaction value */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-medium text-sm mb-1">Maximum Transaction Value</h3>
          <p className="text-white/40 text-xs mb-4">Each transaction cannot exceed this amount in USD</p>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxValueUSD}
                onChange={(e) => {
                  setMaxValueUSD(Number(e.target.value));
                  setErrors((err) => { const n = { ...err }; delete n.maxValue; return n; });
                }}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-white/40 text-sm">USD</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={1}
            max={100}
            value={maxValueUSD}
            onChange={(e) => setMaxValueUSD(Number(e.target.value))}
            className="w-full mt-3 accent-indigo-500"
          />
          <div className="flex justify-between text-white/30 text-xs mt-1">
            <span>$1</span>
            <span>$50</span>
            <span>$100</span>
          </div>

          {errors.maxValue && (
            <p className="text-red-400 text-xs mt-2">{errors.maxValue}</p>
          )}
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30 font-mono">
            condition: &#123; resource: &quot;VALUE&quot;, comparator: &quot;EQUALS&quot;, reference: {maxValueUSD} &#125;
          </div>
        </div>

        {/* Permission types — fixed */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-medium text-sm mb-1">Allowed Transaction Types</h3>
          <p className="text-white/40 text-xs mb-4">Fixed by policy — cannot be overridden</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="text-white/70 text-sm">Transfers (ETH/tokens)</span>
              </div>
              <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">ALLOW</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-white/70 text-sm">Contract Deployments</span>
              </div>
              <span className="text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded-full">DENY</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-white/70 text-sm">Smart Contract Calls</span>
              </div>
              <span className="text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded-full">DENY</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30 font-mono">
            permission.type = &quot;TRANSFER&quot; | &quot;DEPLOY_CONTRACT&quot; (DENY)
          </div>
        </div>

        {/* Allowlisted addresses */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-medium text-sm mb-1">Recipient Address Allowlist</h3>
          <p className="text-white/40 text-xs mb-4">
            Optional. If set, transfers are only allowed to these addresses.
            Leave empty to allow transfers to any address.
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => {
                setNewAddress(e.target.value);
                setErrors((err) => { const n = { ...err }; delete n.address; return n; });
              }}
              placeholder="0x..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAddress())}
            />
            <button
              type="button"
              onClick={addAddress}
              className="bg-indigo-600/50 hover:bg-indigo-600 border border-indigo-500/30 rounded-lg px-3 py-2.5 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {errors.address && (
            <p className="text-red-400 text-xs mb-2">{errors.address}</p>
          )}

          {allowlistedAddresses.length > 0 ? (
            <div className="space-y-1.5">
              {allowlistedAddresses.map((addr) => (
                <div
                  key={addr}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                >
                  <span className="text-white/60 text-xs font-mono">{addr}</span>
                  <button
                    type="button"
                    onClick={() => removeAddress(addr)}
                    className="text-white/30 hover:text-red-400 transition-colors ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/20 text-xs italic">No addresses added — any recipient allowed</p>
          )}

          {allowlistedAddresses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30 font-mono">
              condition: &#123; resource: &quot;TO_ADDRESS&quot;, comparator: &quot;INCLUDED_IN&quot;, reference: [{allowlistedAddresses.length} address{allowlistedAddresses.length === 1 ? "" : "es"}] &#125;
            </div>
          )}
        </div>

        {/* Child email */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-medium text-sm mb-1">Child&apos;s Para Account Email</h3>
          <p className="text-white/40 text-xs mb-4">
            Enter the email your child will use to log in. Use <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">@test.getpara.com</code> for testing.
          </p>
          <input
            type="email"
            value={childEmail}
            onChange={(e) => {
              setChildEmail(e.target.value);
              setErrors((err) => { const n = { ...err }; delete n.childEmail; return n; });
            }}
            placeholder="child@test.getpara.com"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
          />
          {errors.childEmail && (
            <p className="text-red-400 text-xs mt-2">{errors.childEmail}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium py-3 rounded-xl transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Review Policy →
          </button>
        </div>
      </form>
    </div>
  );
}
