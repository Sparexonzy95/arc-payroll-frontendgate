import { ARC_CHAIN_ID } from '../../lib/config'

export type ToolTab = 'payrolls' | 'gateway' | 'piggy' | 'staking' | 'escrow'

export const TOOL_LABELS: Record<ToolTab, string> = {
  payrolls: 'Payrolls',
  gateway: 'Gateway bridge',
  piggy: 'Piggyvest savings',
  staking: 'Staking',
  escrow: 'Escrow',
}

export const TOOL_ORDER: ToolTab[] = [
  'payrolls',
  'gateway',
  'piggy',
  'staking',
  'escrow',
]

// null means "works on any supported chain"
export const TOOL_REQUIRED_CHAIN: Record<ToolTab, number | null> = {
  payrolls: ARC_CHAIN_ID,
  piggy: ARC_CHAIN_ID,
  gateway: null, // IMPORTANT: Gateway must work on Arc + Base
  staking: null,
  escrow: null,
}
