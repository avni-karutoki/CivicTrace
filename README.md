# CivicTrace — Civic Issue Tracker with Verifiable Audit Trail

A full-stack civic complaint tracking system with **off-chain Supabase Postgres** for data, **SHA-256 hash-chain** for tamper-evident audit logs, and **optional on-chain anchoring** (Base Sepolia / Polygon Amoy) for public verification.

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend        │────▶│   Supabase      │
│   (React/Vite)  │     │   (Express)      │     │   (Postgres)    │
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                        │
                          ┌──────▼──────┐          ┌──────▼──────┐
                          │  Hash Chain │          │  RLS +      │
                          │  (SHA-256)  │          │  Service    │
                          └──────┬──────┘          │  Role       │
                                 │                 └─────────────┘
                          ┌──────▼──────┐
                          │  Optional   │
                          │  On-Chain   │
                          │  Anchor     │
                          │  (Base/     │
                          │  Polygon)   │
                          └─────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, TypeScript |
| Backend | Node.js, Express, `@supabase/supabase-js` (service_role) |
| Database | Supabase Postgres 17 (RLS enabled, service_role bypass) |
| Blockchain | Solidity 0.8.24, Hardhat, ethers v6 |
| Networks | Base Sepolia (84532), Polygon Amoy (80002) |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd CivicTrace
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials:
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...

npm install
# Run schema.sql in Supabase Studio > SQL Editor (creates tables, RLS, seed)
npm start          # http://localhost:4000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev        # http://localhost:8443 (Vite dev server)
```

### 4. Blockchain (Optional)

```bash
cd ../blockchain
cp .env.example .env
# Edit .env with DEPLOYER_PRIVATE_KEY (testnet wallet with faucet funds)
npm install
npm run compile
npm run deploy:sepolia   # or deploy:amoy
# Copy deployed CONTRACT_ADDRESS to backend/.env
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional (CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# Optional Web3 Anchor (additive, disabled by default)
ONCHAIN_ENABLED=true
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
CONTRACT_ADDRESS=0xYourDeployedContract
ANCHOR_PRIVATE_KEY=0xYourServerKeyWithFaucetFunds
EXPLORER_URL=https://sepolia.basescan.org
```

### Blockchain (`blockchain/.env`)

```env
DEPLOYER_PRIVATE_KEY=0xYourTestnetWalletKey
BASE_SEPOLIA_RPC=https://sepolia.base.org
AMOY_RPC=https://rpc-amoy.polygon.technology
```

---

## Key Features

### 1. AI Spatial Deduplication
- Haversine distance + category matching
- Auto-merges nearby duplicate reports
- Increments `support_count` and bumps priority

### 2. Tamper-Evident Hash Chain
- Every status change appended to `status_events`
- Each event hashes `(prev_hash + payload)` with SHA-256
- `/complaints/:id/verification` recomputes full chain → `chain_valid: true/false`

### 3. Hidden Complainant Identity
- `complainant_id` stripped server-side from all authority-facing responses
- Not just UI-hidden — removed before JSON serialization

### 4. Auto-Escalation Cron
- Runs every 30s (configurable in `escalation.js`)
- Escalates stale complaints: `REPORTED → ASSESSED → IN_PROGRESS`
- Creates notifications for departments

### 5. Optional On-Chain Anchoring
- Only `bytes32 dataHash` written to contract
- No PII, no photos on-chain
- Verification compares Postgres `this_hash` ↔ contract `latestHash`
- Zero impact when disabled (`ONCHAIN_ENABLED=false`)

---

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/login` | — | `{name, contact, role?}` → token |
| POST | `/complaints` | ✓ | Create report (runs dedup) |
| GET | `/complaints/track/:code` | — | Public status lookup |
| GET | `/complaints` | ✓ | Authority dashboard (no complainant_id) |
| GET | `/complaints/mine` | ✓ | Citizen's filed + supported complaints |
| POST | `/complaints/:id/status` | ✓ | Authority updates status |
| POST | `/complaints/:id/proof-of-fix` | ✓ | Authority uploads fix photo |
| POST | `/complaints/:id/dispute` | ✓ | Citizen reopens complaint |
| GET | `/complaints/:id/verification` | — | Full hash-chain + on-chain anchor |
| GET | `/leaderboard` | — | Departments ranked by resolution |
| GET | `/notifications` | — | Escalation notifications |
| POST | `/admin/run-escalation` | — | Manual escalation sweep |
| GET | `/onchain/status` | — | Web3 config status |

Auth: send `x-user-id: <token>` header on all authenticated routes.

---

## Database Schema (Supabase)

```
users
  id, name, contact, role, department_id, created_at

departments
  id, name, category

complaints
  id, tracking_code, category, description, lat, lng, priority,
  status, department_id, complainant_id, support_count,
  last_action_at, created_at, resolved_at, anchor_tx, anchor_chain_id

complaint_reports
  id, complaint_id, reporter_id, lat, lng, note, created_at

evidence
  id, complaint_id, uploaded_by, kind, photo_ref, photo_hash,
  lat, lng, captured_at

status_events (hash chain)
  id, complaint_id, from_status, to_status, actor_id, actor_role,
  note, prev_hash, this_hash, created_at, tx_hash, chain_id

notifications
  id, department_id, complaint_id, message, created_at, read
```

---

## Deploying to Production

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Render/Railway/Fly.io)
```bash
cd backend
# Set all env vars in platform dashboard
# Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL
# If using Web3: ONCHAIN_ENABLED, RPC_URL, CHAIN_ID, CONTRACT_ADDRESS,
# ANCHOR_PRIVATE_KEY, EXPLORER_URL
npm start
```

### Database
- Run `backend/supabase/schema.sql` once in Supabase Studio
- Run `backend/supabase/migration_add_anchor.sql` if enabling Web3

### Blockchain
- Deploy once to testnet: `npm run deploy:sepolia` in `blockchain/`
- Fund `ANCHOR_PRIVATE_KEY` wallet with testnet ETH (Base Sepolia faucet)

---

## Project Structure

```
CivicTrace/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/             # API clients (civictrace.ts, onchain.ts)
│   │   ├── components/      # UI components
│   │   └── App.tsx
│   └── package.json
├── backend/                  # Express + Supabase
│   ├── src/
│   │   ├── routes/          # auth, complaints, leaderboard
│   │   ├── onchain.js       # Web3 anchor (ethers v6)
│   │   ├── hashchain.js     # SHA-256 chain logic
│   │   ├── dedup.js         # Spatial deduplication
│   │   ├── escalation.js    # Auto-escalation cron
│   │   ├── supabase.js      # Supabase client
│   │   └── server.js        # Express app
│   ├── supabase/
│   │   ├── schema.sql       # Full schema + RLS + seed
│   │   └── migration_add_anchor.sql  # Web3 columns
│   └── package.json
├── blockchain/               # Hardhat + Solidity
│   ├── contracts/
│   │   └── CivicTrace.sol   # Anchor registry
│   ├── scripts/
│   │   └── deploy.cjs
│   ├── hardhat.config.cjs
│   └── package.json
└── README.md
```

---

## Security Notes

| Aspect | Status | Notes |
|--------|--------|-------|
| Complainant anonymity | Code-enforced | `complainant_id` stripped server-side |
| RLS | Enabled | Defense-in-depth; backend uses service_role |
| SQL Injection | Protected | Parameterized via Supabase client |
| On-chain data | Hashes only | No PII, photos, or raw data on-chain |
| Private keys | Env only | Never committed; use `.env` |

---

## License

MIT — see individual package.json files for dependencies.

---

## Credits

Built for hackathon/demo scope. Production hardening needed:
- Replace demo auth with real OTP/OAuth
- Enforce camera-only capture on frontend
- Add photo perceptual hashing to dedup
- Implement proper RLS policies for direct PostgREST access
- Swap escalation thresholds to real day-based values