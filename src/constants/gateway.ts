// src/constants/gateway.ts

// Gateway Wallet contract is the same across supported networks
// (from Circle Gateway quickstart docs)
export const GATEWAY_WALLET_ADDRESS =
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" as const;

// USDC addresses for networks we're using with Gateway.
// For now we only wire Base Sepolia directly in the dapp.
export const USDC_BASE_SEPOLIA =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

// Minimal ABI for GatewayWallet.deposit used in the quickstart:
// function deposit(address token, uint256 value)
export const gatewayWalletAbi = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
