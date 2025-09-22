"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Bu bileşen, bağlı cüzdanın SOL bakiyesini gösterir.
const WalletBalance: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bakiyeyi getiren asenkron fonksiyon
  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Bakiyeyi getirirken bir hata oluştu:", err);
      setError("Bakiyeyi çekerken bir sorun oluştu.");
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  // Cüzdan bağlandığında veya değiştiğinde otomatik olarak bakiyeyi getir.
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Sayfada görüntülenecek kısım
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-xl shadow-lg m-4 w-full max-w-sm">
      <h2 className="text-xl font-bold text-white mb-4">Cüzdan Bakiyesi</h2>
      <div className="flex items-center gap-4">
        {isLoading ? (
          <p className="text-gray-400">Yükleniyor...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : balance !== null ? (
          <p className="text-4xl font-extrabold text-lime-400">
            {balance.toFixed(4)} <span className="text-xl font-medium">SOL</span>
          </p>
        ) : (
          <p className="text-gray-400">Cüzdanınızı bağlayın.</p>
        )}
        <button
          onClick={fetchBalance}
          disabled={!publicKey || isLoading}
          className="p-2 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bakiyeyi Yenile"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 0020.984 8H20.5v-1h-1.582l-.634-1.874"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 20v-5h-.582m-15.356-2A8.001 8.001 0 003.016 16H3.5v1h1.582l.634 1.874"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WalletBalance;
