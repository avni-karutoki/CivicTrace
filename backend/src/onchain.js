// Optional Web3 anchor layer. Disabled by default so the deployed site is unchanged.
// Enable by setting ONCHAIN_ENABLED=true + RPC_URL + CONTRACT_ADDRESS + ANCHOR_PRIVATE_KEY.
// All functions are no-ops when disabled and never throw into the main request path.

const ENABLED = process.env.ONCHAIN_ENABLED === "true";
const RPC_URL = process.env.RPC_URL || "";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const CHAIN_ID = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : null;
const EXPLORER_URL = (process.env.EXPLORER_URL || "").replace(/\/$/, "");

const ABI = [
  "function fileComplaint(string complaintId, string trackingCode, bytes32 dataHash) external",
  "function updateStatus(string complaintId, string fromStatus, string toStatus, bytes32 dataHash) external",
  "function latestHash(bytes32 idHash) view returns (bytes32)",
  "function _idHash(string complaintId) pure returns (bytes32)",
];

let _ethers = null;
let _contract = null;
let _warned = false;

function warnOnce(msg) {
  if (!_warned) {
    console.warn(`[onchain] disabled: ${msg}`);
    _warned = true;
  }
}

async function getContract() {
  if (!ENABLED) {
    warnOnce("ONCHAIN_ENABLED != true");
    return null;
  }
  if (!RPC_URL || !CONTRACT_ADDRESS || !process.env.ANCHOR_PRIVATE_KEY) {
    warnOnce("missing RPC_URL / CONTRACT_ADDRESS / ANCHOR_PRIVATE_KEY");
    return null;
  }
  try {
    if (!_ethers) _ethers = (await import("ethers")).default ?? (await import("ethers"));
    // Lazy instances; recreated if env changes between calls (tests).
    const provider = new _ethers.JsonRpcProvider(RPC_URL, CHAIN_ID ?? undefined);
    const wallet = new _ethers.Wallet(process.env.ANCHOR_PRIVATE_KEY, provider);
    _contract = new _ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    return _contract;
  } catch (e) {
    console.error("[onchain] init failed (continuing off-chain):", e.message);
    return null;
  }
}

function toBytes32(hexHash) {
  if (!hexHash) return "0x" + "0".repeat(64);
  const h = hexHash.startsWith("0x") ? hexHash : "0x" + hexHash;
  return h.length === 66 ? h : "0x" + "0".repeat(64);
}

export function isOnchainEnabled() {
  return ENABLED && Boolean(RPC_URL && CONTRACT_ADDRESS && process.env.ANCHOR_PRIVATE_KEY);
}

export function explorerTxUrl(txHash) {
  if (!txHash || !EXPLORER_URL) return null;
  return `${EXPLORER_URL}/tx/${txHash}`;
}

// Fire-and-forget anchor. Never throws — callers must not await critically.
export async function anchorStatusEvent({ complaintId, trackingCode, fromStatus, toStatus, thisHash }) {
  try {
    const c = await getContract();
    if (!c) return { enabled: false, txHash: null };
    const dataHash = toBytes32(thisHash);
    let tx;
    if (!fromStatus) {
      tx = await c.fileComplaint(complaintId, trackingCode || "", dataHash);
    } else {
      tx = await c.updateStatus(complaintId, fromStatus || "", toStatus || "", dataHash);
    }
    // Don't block the API response on mining; return hash immediately.
    return { enabled: true, txHash: tx.hash, chainId: CHAIN_ID };
  } catch (e) {
    console.error("[onchain] anchor failed (off-chain record already saved):", e.message);
    return { enabled: true, txHash: null, error: e.message };
  }
}

// Read-only verify: compare local this_hash vs contract latestHash.
export async function verifyOnchain(complaintId, localHash) {
  try {
    const c = await getContract();
    if (!c) return { enabled: false };
    const { ethers } = await import("ethers").catch(() => ({ ethers: _ethers }));
    const E = _ethers ?? ethers;
    const idHash = E.keccak256(E.toUtf8Bytes(complaintId));
    const onchain = await c.latestHash(idHash);
    const norm = (v) => (v || "").toLowerCase();
    return {
      enabled: true,
      contract: CONTRACT_ADDRESS,
      chainId: CHAIN_ID,
      explorer: EXPLORER_URL || null,
      onchainHash: onchain,
      match: norm(onchain) === norm(toBytes32(localHash)),
    };
  } catch (e) {
    return { enabled: true, error: e.message };
  }
}
