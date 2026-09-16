// Optional on-chain helpers. No-ops when backend has ONCHAIN_ENABLED=false.
// This file is additive — existing UI renders identically when anchors are absent.

import { apiFetch } from "./civictrace";

export interface OnchainStatus {
  enabled: boolean;
  chainId: number | null;
  contract: string | null;
  explorer: string | null;
}

export async function getOnchainStatus(): Promise<OnchainStatus> {
  try {
    return await apiFetch("/onchain/status");
  } catch {
    return { enabled: false, chainId: null, contract: null, explorer: null };
  }
}

export function shortTx(tx: string | null | undefined): string | null {
  if (!tx) return null;
  return tx.length > 12 ? `${tx.slice(0, 6)}…${tx.slice(-4)}` : tx;
}
