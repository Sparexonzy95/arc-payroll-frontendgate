# Arc Payroll Frontend

React + Vite + Tailwind v4.1 + wagmi + viem frontend for the Arc Payroll system.

## Tech stack

- React 18
- Vite
- TypeScript
- Tailwind CSS 4.1 (no config, `@tailwindcss/vite` plugin)
- Framer Motion
- wagmi + viem (wallet, chains, contract calls)
- TanStack React Query (server state)
- React Router

## Features

- Wallet connect (MetaMask / injected)
- Employer onboarding (wallet -> backend employer record)
- Dashboard:
  - Native balances on Arc Testnet and Base Sepolia
  - Circle Gateway balances via backend wrapper
  - Gateway transfer form (domain-to-domain USDC)
- Payrolls:
  - List payrolls from backend
  - Multi-step payroll creation wizard
  - Payroll detail with:
    - schedule
    - metadata hash / Merkle root display
    - funding summary
    - payments table
  - "Create onchain" via `POST /create_onchain/` -> `eth_sendTransaction`
  - "Fund payroll" via direct PayrollManager `fundPayroll` contract call

## Environment variables

Copy `.env.example` to `.env` and adjust:

```bash
VITE_API_BASE_URL=http://localhost:8000

VITE_ARC_CHAIN_ID=5042002
VITE_BASE_CHAIN_ID=84532

VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_BASE_RPC_URL=https://sepolia.base.org

VITE_ARC_PAYROLL_MANAGER=0xdc60db8b87Aa784515A9FB667e3BB2D195808A16
VITE_BASE_PAYROLL_MANAGER=0x92fa2Bd3756Eb41Accaf5131a4423F108D1D2712
```

Make sure:

- The backend is reachable at `VITE_API_BASE_URL`.
- Chain IDs and RPC URLs match your Arc Testnet and Base Sepolia setup.
- PayrollManager addresses match deployed contracts on each chain.

## Install & run

Use PNPM:

```bash
pnpm install
pnpm dev
```

Vite will start on `http://localhost:5173`.

## High-level flow

1. Connect wallet (MetaMask).
2. If the wallet has no employer record:
   - Fill employer name + email.
   - Backend will store `wallet_address` and return employer id.
3. Dashboard:
   - Shows native balances on Arc and Base.
   - Loads Gateway balances via `/api/gateway/balances/`.
   - Allows transfers via `/api/gateway/transfer/`.
4. Payrolls:
   - Go to **Payrolls**.
   - Click **Create payroll** to run the multi-step wizard:
     - Step 1: choose chain + default token (from backend tokens).
     - Step 2: schedule configuration.
     - Step 3: employees + net/tax + encrypted refs.
     - Step 4: onchain payroll id + metadata hash + payments Merkle root.
   - On submit, frontend calls `POST /api/payrolls/payrolls/`.
5. Payroll detail:
   - Call **Create onchain**:
     - Frontend calls `POST /api/payrolls/payrolls/{id}/create_onchain/`.
     - Backend returns `{ to, data, chainId }`.
     - Wallet sends raw `eth_sendTransaction` using those values.
   - Call **Fund payroll**:
     - Frontend reads funding summary from backend.
     - Uses PayrollManager ABI + wagmi to call `fundPayroll(payrollId, token, amount)` on the current chain.

## Notes

- Amounts in the wizard are entered as human strings (e.g. `10.5`) and converted into integer amounts with 6 decimals, matching USDC-style tokens.
- Merkle root and metadata hash are pasted as hex strings from off-chain tools.
- Funding and payment status rely on backend event-sync (Celery + web3.py).
