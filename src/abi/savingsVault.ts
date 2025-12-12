// src/abi/savingsVault.ts

// Correct SavingsVault ABI, extracted ONLY from the "abi" field
// of the Hardhat artifact you provided.

export const savingsVaultAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "initialOwner", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "savingId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "planType", "type": "uint8" },
      { "indexed": false, "internalType": "uint64", "name": "createdAt", "type": "uint64" },
      { "indexed": false, "internalType": "uint64", "name": "maturesAt", "type": "uint64" }
    ],
    "name": "SavingCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "savingId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "SavingDeposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "savingId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "SavingWithdrawal",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "allowed", "type": "bool" }
    ],
    "name": "SupportedTokenUpdated",
    "type": "event"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint8", "name": "planType", "type": "uint8" },
      { "internalType": "uint64", "name": "maturesAt", "type": "uint64" }
    ],
    "name": "createSaving",
    "outputs": [{ "internalType": "uint256", "name": "savingId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "savingId", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "savingId", "type": "uint256" }
    ],
    "name": "getAvailable",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "isSupportedToken",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "nextSavingId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "savings",
    "outputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint8", "name": "planType", "type": "uint8" },
      { "internalType": "uint64", "name": "createdAt", "type": "uint64" },
      { "internalType": "uint64", "name": "maturesAt", "type": "uint64" },
      { "internalType": "uint128", "name": "principal", "type": "uint128" },
      { "internalType": "uint128", "name": "withdrawn", "type": "uint128" },
      { "internalType": "bool", "name": "closed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "bool", "name": "allowed", "type": "bool" }
    ],
    "name": "setSupportedToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "savingId", "type": "uint256" }
    ],
    "name": "withdrawFixed",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "savingId", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdrawFlex",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const
