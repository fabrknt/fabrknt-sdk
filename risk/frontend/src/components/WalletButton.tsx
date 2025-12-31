import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
    const { connected, publicKey } = useWallet();

    return (
        <div className="flex items-center gap-4">
            <WalletMultiButton className="!bg-pulsar-primary !text-black hover:!bg-pulsar-primary/90" />
            {connected && publicKey && (
                <div className="text-sm text-gray-400">
                    {publicKey.toBase58().slice(0, 4)}...
                    {publicKey.toBase58().slice(-4)}
                </div>
            )}
        </div>
    );
}
