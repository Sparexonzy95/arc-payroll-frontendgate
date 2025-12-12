export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID)
export const BASE_CHAIN_ID = Number(import.meta.env.VITE_BASE_CHAIN_ID)

export const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL
export const BASE_RPC_URL = import.meta.env.VITE_BASE_RPC_URL

export const ARC_PAYROLL_MANAGER =
  import.meta.env.VITE_ARC_PAYROLL_MANAGER as `0x${string}`
export const BASE_PAYROLL_MANAGER =
  import.meta.env.VITE_BASE_PAYROLL_MANAGER as `0x${string}`


  export const ARC_SAVINGS_VAULT =
  import.meta.env.VITE_ARC_SAVINGS_VAULT as `0x${string}`