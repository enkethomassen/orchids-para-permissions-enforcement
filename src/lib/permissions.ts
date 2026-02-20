// Para Permissions Architecture Types
// Based on the official Para permissions schema

export type PermissionEffect = "ALLOW" | "DENY";
export type PermissionType = "TRANSFER" | "SIGN_MESSAGE" | "SMART_CONTRACT" | "DEPLOY_CONTRACT";
export type ConditionType = "STATIC";
export type ConditionResource = "VALUE" | "TO_ADDRESS" | "ARGUMENTS[1]";
export type ConditionComparator = "EQUALS" | "GREATER_THAN" | "INCLUDED_IN";

export interface PolicyCondition {
  type: ConditionType;
  resource: ConditionResource;
  comparator: ConditionComparator;
  reference: number | string | string[];
}

export interface PolicyPermission {
  effect: PermissionEffect;
  chainId: string;
  type: PermissionType;
  smartContractFunction?: string;
  smartContractAddress?: string;
  conditions: PolicyCondition[];
}

export interface PolicyScope {
  name: string;
  description: string;
  required: boolean;
  permissions: PolicyPermission[];
}

export interface ParaPolicy {
  partnerId: string;
  validFrom?: number;
  validTo?: number;
  scopes: PolicyScope[];
}

// Allowance wallet policy configuration
export interface AllowanceConfig {
  maxTransactionValueUSD: number;
  allowlistedAddresses: string[];
  childEmail: string;
}

// Base Sepolia testnet (chainId 84532) — enforced by Para policy
const BASE_CHAIN_ID = "84532";

/**
 * Build a Para-compliant policy from allowance config.
 *
 * Rules encoded:
 *  - ALLOW TRANSFER on Base with VALUE <= maxTransactionValueUSD (EQUALS = max cap)
 *  - Optional TO_ADDRESS INCLUDED_IN allowlist
 *  - DENY DEPLOY_CONTRACT on Base
 */
export function buildAllowancePolicy(config: AllowanceConfig, partnerId: string): ParaPolicy {
  // Conditions for the ALLOW TRANSFER permission
  const transferConditions: PolicyCondition[] = [
    // Max transaction value enforced by Para backend via VALUE EQUALS comparison
    {
      type: "STATIC",
      resource: "VALUE",
      comparator: "EQUALS",
      reference: config.maxTransactionValueUSD,
    },
  ];

  // Optional recipient allowlist
  if (config.allowlistedAddresses.length > 0) {
    transferConditions.push({
      type: "STATIC",
      resource: "TO_ADDRESS",
      comparator: "INCLUDED_IN",
      reference: config.allowlistedAddresses,
    });
  }

  return {
    partnerId,
    scopes: [
      {
        name: "Allowance Transfer",
        description: `Send up to $${config.maxTransactionValueUSD} USD per transaction on Base network`,
        required: true,
        permissions: [
          // Allow transfers on Base with value cap + optional address allowlist
          {
            effect: "ALLOW",
            chainId: BASE_CHAIN_ID,
            type: "TRANSFER",
            conditions: transferConditions,
          },
          // Block contract deployments on Base
          {
            effect: "DENY",
            chainId: BASE_CHAIN_ID,
            type: "DEPLOY_CONTRACT",
            conditions: [],
          },
        ],
      },
    ],
  };
}

// Human-readable rule descriptions for display in the UI
export function policyToReadableRules(policy: ParaPolicy): string[] {
  const rules: string[] = [];

  for (const scope of policy.scopes) {
    for (const perm of scope.permissions) {
      const chainLabel = perm.chainId === BASE_CHAIN_ID ? "Base Sepolia (testnet)" : `Chain ${perm.chainId}`;

      if (perm.effect === "DENY" && perm.type === "DEPLOY_CONTRACT") {
        rules.push("Contract deployments are blocked");
        continue;
      }

      if (perm.effect === "ALLOW" && perm.type === "TRANSFER") {
        const valueCondition = perm.conditions.find(
          (c) => c.resource === "VALUE" && c.comparator === "EQUALS"
        );
        const addressCondition = perm.conditions.find(
          (c) => c.resource === "TO_ADDRESS" && c.comparator === "INCLUDED_IN"
        );

        let rule = `Transfers on ${chainLabel}`;
        if (valueCondition) {
          rule += ` up to $${valueCondition.reference} USD per transaction`;
        }
        rules.push(rule);

        if (addressCondition && Array.isArray(addressCondition.reference)) {
          const addrs = addressCondition.reference as string[];
          rules.push(
            `Recipient must be one of: ${addrs.length} approved address${addrs.length === 1 ? "" : "es"}`
          );
          addrs.forEach((addr) => {
            rules.push(`  • ${addr}`);
          });
        } else {
          rules.push("Any recipient address is allowed");
        }
      }
    }
  }

  return [...new Set(rules)];
}
