import { z } from "zod";
import { Wallet } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  chain: z
    .enum([
      "ethereum",
      "base",
      "optimism",
      "arbitrum",
      "polygon",
      "gnosis",
      "scroll",
      "celo",
      "zksync",
    ])
    .default("ethereum"),
  address: z.string().default(""),
});

export type WalletTxConfig = z.infer<typeof schema>;

export interface WalletTxMeta {
  chainId: number;
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUsd?: number;
  method?: string;
  status: "success" | "failed";
  blockNumber: number;
  gasUsed?: string;
}

const CHAIN_LABELS: Record<WalletTxConfig["chain"], string> = {
  ethereum: "Ethereum",
  base: "Base",
  optimism: "Optimism",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  gnosis: "Gnosis",
  scroll: "Scroll",
  celo: "Celo",
  zksync: "zkSync",
};

function shortAddr(a: string): string {
  const trimmed = a.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

export const meta: PluginMeta<WalletTxConfig, WalletTxMeta> = {
  id: "wallet-tx",
  label: "Wallet · Transactions",
  description: "Latest on-chain transactions for an EVM wallet address.",
  icon: Wallet,
  accent: "#627eea",
  category: "blockchain",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const label = CHAIN_LABELS[c.chain] ?? c.chain;
    const addr = shortAddr(c.address);
    return addr ? `${label} · ${addr}` : `Wallet · ${label}`;
  },
  capabilities: { paginated: true },
};
