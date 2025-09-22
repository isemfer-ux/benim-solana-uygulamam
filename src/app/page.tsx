"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  GetProgramAccountsFilter,
} from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface TokenBalance {
  mintAddress: string;
  amount: number;
}

export default function Home() {
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [splTokens, setSplTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [splLoading, setSplLoading] = useState(false);

  const fetchSolBalance = useCallback(async () => {
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
  }, [publicKey]);

  const fetchSplTokens = useCallback(async () => {
    if (!publicKey) {
      setSplTokens([]);
      return;
    }

    setSplLoading(true);
    try {
      const heliusApiKey = "8e2fd160-d29c-452f-bfd5-507192363a1f";
      const connection = new Connection(
        `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
      );
      
      const filters: GetProgramAccountsFilter[] = [
        {
          dataSize: 165,
        },
        {
          memcmp: {
            offset: 32,
            bytes: publicKey.toBase58(),
          },
        },
      ];

      const tokenAccounts = await connection.getParsedProgramAccounts(
        new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        { filters: filters }
      );

      const tokens = tokenAccounts.map((account) => {
        const parsedAccount = account.account.data as ParsedAccountData;
        return {
          mintAddress: parsedAccount.parsed.info.mint,
          amount: parsedAccount.parsed.info.tokenAmount.uiAmount,
        };
      });
      setSplTokens(tokens);
    } catch (error) {
      console.error(
        "failed to get SPL balances for account " + publicKey.toBase58() + ": " + error
      );
      setSplTokens([]);
    }
    setSplLoading(false);
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      fetchSolBalance();
    }
  }, [fetchSolBalance, publicKey]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col space-y-4">
        <h1 className="text-4xl font-bold mb-4">Solana Cüzdan Bağlama</h1>
        <p className="text-lg text-center">
          Cüzdanınızı bağlayarak SOL ve SPL token bakiyelerinizi görün.
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
              <h2 className="text-2xl font-bold mb-2 text-center">Bakiyeler</h2>
              {loading ? (
                <p className="text-white text-center">SOL bakiyesi yükleniyor...</p>
              ) : (
                <p className="text-lg text-center">
                  <span className="font-semibold text-green-400">SOL:</span>{" "}
                  {solBalance !== null ? `${solBalance}` : "Bakiye alınamadı"}
                </p>
              )}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={fetchSplTokens}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200"
                disabled={splLoading}
              >
                {splLoading ? "Yükleniyor..." : "SPL Token'ları Getir"}
              </button>
              
              <div className="mt-4 text-left">
                {splLoading ? (
                  <p className="text-white text-center">SPL token&apos;lar yükleniyor...</p>
                ) : (
                  splTokens.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-xl font-semibold mb-2">SPL Token&apos;lar:</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {splTokens
                          .filter(token => token.amount > 0) // Burada filtreleme yapılıyor
                          .map((token, index) => (
                            <li key={index} className="bg-slate-700 p-2 rounded">
                              <span className="font-mono text-sm text-gray-400">
                                Mint Adresi: {token.mintAddress}
                              </span>
                              <br />
                              <span className="font-bold text-lg text-purple-400">
                                Miktar: {token.amount}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-400 mt-4 text-center">Hiç SPL token bakiyesi bulunamadı.</p>
                  )
                )}
              </div>
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
