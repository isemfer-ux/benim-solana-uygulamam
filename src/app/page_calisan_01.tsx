"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSolBalance = async () => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }

    setLoading(true);
    try {
      const heliusApiKey = "8e2fd160-d29c-452f-bfd5-507192363a1f";
      const connection = new Connection(
        `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
      );
      const accountBalance = await connection.getBalance(publicKey);
      setSolBalance(accountBalance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error(
        "failed to get SOL balance for account " + publicKey + ": " + error
      );
      setSolBalance(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (publicKey) {
      fetchSolBalance();
    }
  }, [publicKey]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col space-y-4">
        <h1 className="text-4xl font-bold mb-4">Solana Cüzdan Bağlama</h1>
        <p className="text-lg text-center">
          Cüzdanınızı bağlayarak SOL bakiyenizi görün.
        </p>

        <div className="p-4 bg-slate-800 rounded-xl shadow-lg mt-4">
          <WalletMultiButtonDynamic />
        </div>

        {publicKey ? (
          <div className="p-6 bg-slate-800 rounded-xl shadow-lg mt-4 w-full text-center">
            <p className="text-lg text-white">
              Bağlı Cüzdan:{" "}
              <span className="font-semibold text-green-400">
                {publicKey.toBase58()}
              </span>
            </p>
            <div className="mt-6 text-left">
              <h2 className="text-2xl font-bold mb-2 text-center">Bakiyeniz</h2>
              {loading ? (
                <p className="text-white text-center">Bakiye yükleniyor...</p>
              ) : (
                <p className="text-lg text-center">
                  <span className="font-semibold text-green-400">SOL:</span>{" "}
                  {solBalance !== null ? `${solBalance}` : "Bakiye alınamadı"}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-white mt-4 text-center">
            Lütfen bir cüzdan bağlayın.
          </p>
        )}
      </div>
    </main>
  );
}
