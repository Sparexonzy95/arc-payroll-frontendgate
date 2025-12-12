// src/hooks/useGatewayDeposit.ts
import { useCallback } from "react";
import { erc20Abi } from "viem";
import { baseSepolia } from "wagmi/chains";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import toast from "react-hot-toast";
import {
  GATEWAY_WALLET_ADDRESS,
  USDC_BASE_SEPOLIA,
  gatewayWalletAbi,
} from "../../constants/gateway";

// Convert a human USDC amount (with up to 6 decimals) into atomic units (BigInt).
// e.g. "10.5" -> 10500000n
function parseUsdcAmount(amount: string): bigint | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;

  if (!/^\d+(\.\d{0,6})?$/.test(trimmed)) {
    return null;
  }

  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "000000").slice(0, 6);
  try {
    const wholeBig = BigInt(whole);
    const fracBig = BigInt(fracPadded);
    return wholeBig * 1_000_000n + fracBig;
  } catch {
    return null;
  }
}

export function useGatewayDeposit() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();

  const deposit = useCallback(
    async (amountStr: string) => {
      if (!isConnected || !address) {
        toast.error("Connect your wallet first.");
        return;
      }

      const value = parseUsdcAmount(amountStr);
      if (value === null || value <= 0n) {
        toast.error("Enter a valid USDC amount (up to 6 decimals).");
        return;
      }

      try {
        // Ensure we are on Base Sepolia
        if (chainId !== baseSepolia.id) {
          await switchChainAsync?.({ chainId: baseSepolia.id });
        }

        // 1) Approve GatewayWallet to spend USDC
        toast.loading("Approving Gateway Wallet for USDC...", { id: "gw-deposit" });
        const approveHash = await writeContractAsync({
          abi: erc20Abi,
          address: USDC_BASE_SEPOLIA,
          functionName: "approve",
          args: [GATEWAY_WALLET_ADDRESS, value],
        });

        toast.success(`Approve tx sent: ${approveHash.slice(0, 10)}...`, {
          id: "gw-deposit",
        });

        // 2) Call GatewayWallet.deposit(USDC, value)
        toast.loading("Depositing USDC into Gateway Wallet...", {
          id: "gw-deposit",
        });
        const depositHash = await writeContractAsync({
          abi: gatewayWalletAbi,
          address: GATEWAY_WALLET_ADDRESS,
          functionName: "deposit",
          args: [USDC_BASE_SEPOLIA, value],
        });

        toast.success(
          `Deposit tx sent: ${depositHash.slice(0, 10)}... Gateway will reflect after finality.`,
          { id: "gw-deposit" },
        );
      } catch (err: any) {
        console.error("Gateway deposit error", err);
        const msg =
          err?.shortMessage ||
          err?.message ||
          "Failed to deposit into Gateway. Check console/logs.";
        toast.error(msg, { id: "gw-deposit" });
      }
    },
    [address, chainId, isConnected, switchChainAsync, writeContractAsync],
  );

  return {
    deposit,
    isDepositing: isPending,
    targetChain: baseSepolia,
  };
}
