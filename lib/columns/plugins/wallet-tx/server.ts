import "server-only";

// Uses Blockscout REST v2 (keyless multi-chain) — see lib/integrations/blockscout.ts.

import {
  defineColumnServer,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchAddressTransactions } from "@/lib/integrations/blockscout";
import { meta, type WalletTxConfig, type WalletTxMeta } from "./plugin";

const fetch: ServerFetcher<WalletTxConfig, WalletTxMeta> = async (
  config,
  cursor,
) => {
  const address = config.address.trim();
  if (!address) return { items: [] };
  return fetchAddressTransactions(config.chain, address, cursor);
};

export const server = defineColumnServer<WalletTxConfig, WalletTxMeta>({
  meta,
  fetch,
});
