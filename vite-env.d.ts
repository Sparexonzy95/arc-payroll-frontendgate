/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ARC_CHAIN_ID: string
  readonly VITE_BASE_CHAIN_ID: string
  readonly VITE_ARC_RPC_URL: string
  readonly VITE_BASE_RPC_URL: string
  readonly VITE_ARC_PAYROLL_MANAGER: string
  readonly VITE_BASE_PAYROLL_MANAGER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
