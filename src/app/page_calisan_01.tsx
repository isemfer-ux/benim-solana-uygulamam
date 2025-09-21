"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Cüzdan butonunun stil dosyasını içeri aktarıyoruz.
import "@solana/wallet-adapter-react-ui/styles.css";

// WalletMultiButton'u dinamik olarak import ediyoruz
const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      // Helius'un RPC endpoint'ini doğru API anahtarınızla kullanıyoruz.
      // Lütfen "YOUR_HELIUS_API_KEY" yerine kendi Helius anahtarınızı yazın.
      const heliusApiKey = "8e2fd160-d29c-452f-bfd5-507192363a1f";
      const connection = new Connection(
        `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
      );
      const accountBalance = await connection.getBalance(publicKey);
      setBalance(accountBalance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error(
        "failed to get balance of account " + publicKey + ": " + error
      );
      setBalance(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey]);

return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col space-y-4">
        <h1 className="text-4xl font-bold mb-4">Solana Cüzdan Bağlama</h1>
        <p className="text-lg">Cüzdanınızı bağlayarak SOL bakiyenizi görün.</p>

        {/* Cüzdan Bağlama Butonu */}
        <div className="p-4 bg-slate-800 rounded-xl shadow-lg">
          <WalletMultiButtonDynamic />
        </div>

        {/* Bağlıysa Bakiyeyi Göster */}
        {publicKey ? (
          <div className="p-4 bg-slate-800 rounded-xl shadow-lg mt-4 w-full text-center">
            <p className="text-lg text-white">
              Bağlı Cüzdan:{" "}
              <span className="font-semibold text-green-400">
                {publicKey.toBase58()}
              </span>
            </p>
            {loading ? (
              <p className="text-white mt-2">Bakiye yükleniyor...</p>
            ) : (
              <p className="text-lg text-white mt-2">
                Bakiyeniz:{" "}
                <span className="font-semibold text-green-400">
                  {balance !== null ? `${balance} SOL` : "Bakiye alınamadı"}
                </span>
              </p>
            )}
            <button
              onClick={fetchBalance}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              {loading ? "Yenileniyor..." : "Bakiyeyi Yenile"}
            </button>
          </div>
        ) : (
          <p className="text-white mt-4">Lütfen bir cüzdan bağlayın.</p>
        )}
      </div>
    </main>
  );
}
