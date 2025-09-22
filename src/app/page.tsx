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
  name?: string | null;
  symbol?: string | null;
  icon?: string | null;
  price?: number | null; // Dolar fiyatı için yeni alan
}

interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
    };
    links: {
      image: string;
    };
  };
}

export default function Home() {
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [splTokens, setSplTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalWalletValue, setTotalWalletValue] = useState<number | null>(null);

  const heliusApiKey = "8e2fd160-d29c-452f-bfd5-507192363a1f";
  const connection = new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
  );

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(null);
      setSplTokens([]);
      setTotalWalletValue(null);
      return;
    }

    setLoading(true);
    try {
      // 1. SOL Bakiyesini Çek
      const solAccountBalance = await connection.getBalance(publicKey);
      const sol = solAccountBalance / LAMPORTS_PER_SOL;

      // 2. SPL Token Bakiyelerini Çek
      const filters: GetProgramAccountsFilter[] = [
        { dataSize: 165 },
        { memcmp: { offset: 32, bytes: publicKey.toBase58() } },
      ];

      const tokenAccounts = await connection.getParsedProgramAccounts(
        new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        { filters: filters }
      );

      const tokensWithoutMetadata = tokenAccounts.map((account) => {
        const parsedAccount = account.account.data as ParsedAccountData;
        return {
          mintAddress: parsedAccount.parsed.info.mint,
          amount: parsedAccount.parsed.info.tokenAmount.uiAmount,
        };
      });

      const nonZeroTokens = tokensWithoutMetadata.filter(token => token.amount > 0);
      const mintAddresses = nonZeroTokens.map(token => token.mintAddress);
      
      // 3. Token Metadata'sını (isim, sembol, ikon) Çek
      const metadataResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetBatch',
          params: { ids: mintAddresses },
        }),
      });

      const metadataData = await metadataResponse.json();
      const assets: HeliusAsset[] = metadataData.result;

      const tokensWithMetadata = nonZeroTokens.map((token) => {
        const asset = assets.find((a: HeliusAsset) => a.id === token.mintAddress);
        return {
          ...token,
          name: asset?.content?.metadata?.name || null,
          symbol: asset?.content?.metadata?.symbol || null,
          icon: asset?.content?.links?.image || null,
        };
      });

      // 4. Fiyatlandırma API'sinden Fiyatları Çek
      const allMintAddresses = ["So11111111111111111111111111111111111111112", ...mintAddresses];
      const priceResponse = await fetch(
        `https://price.jup.ag/v4/price?ids=${allMintAddresses.join('%2C')}`
      );
      const priceData = await priceResponse.json();
      const prices = priceData.data;

      // 5. Toplam Değeri Hesapla ve Token'lara Fiyatları Ekle
      let totalValue = 0;
      
      const solPrice = prices["So11111111111111111111111111111111111111112"]?.price || 0;
      totalValue += sol * solPrice;

      const updatedSplTokens = tokensWithMetadata.map(token => {
        const price = prices[token.mintAddress]?.price || 0;
        totalValue += token.amount * price;
        return { ...token, price };
      });

      // 6. Tüm Durumları Tek Seferde Güncelle
      setSolBalance(sol);
      setSplTokens(updatedSplTokens);
      setTotalWalletValue(totalValue);

    } catch (error) {
      console.error("Veriler alınırken bir hata oluştu: ", error);
      setSolBalance(null);
      setSplTokens([]);
      setTotalWalletValue(null);
    }
    setLoading(false);
  }, [publicKey, connection]);

  // Cüzdan bağlandığında verileri otomatik olarak çek
  useEffect(() => {
    fetchData();
  }, [fetchData]);


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
            
            {totalWalletValue !== null ? (
              <div className="mt-4 text-center">
                <h2 className="text-3xl font-bold text-green-500">
                  Toplam Cüzdan Değeri:
                </h2>
                <p className="text-4xl mt-1">
                  ${totalWalletValue.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 mt-4 text-center">
                Toplam cüzdan değeri hesaplanıyor...
              </p>
            )}

            <div className="mt-6 text-left">
              <h2 className="text-2xl font-bold mb-2 text-center">Bakiyeler</h2>
              {loading ? (
                <p className="text-white text-center">Veriler yükleniyor...</p>
              ) : (
                <p className="text-lg text-center">
                  <span className="font-semibold text-green-400">SOL:</span>{" "}
                  {solBalance !== null ? `${solBalance}` : "Bakiye alınamadı"}
                </p>
              )}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200"
                disabled={loading}
              >
                {loading ? "Yükleniyor..." : "Yenile"}
              </button>
              
              <div className="mt-4 text-left">
                {loading ? (
                  <p className="text-white text-center">SPL token&apos;lar yükleniyor...</p>
                ) : (
                  splTokens.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-xl font-semibold mb-2">SPL Token&apos;lar:</h3>
                      <ul className="list-none space-y-4">
                        {splTokens
                          .filter(token => token.amount > 0)
                          .map((token, index) => (
                            <li key={index} className="bg-slate-700 p-4 rounded-xl flex items-center space-x-4">
                                {token.icon ? (
                                    <img src={token.icon} alt={`${token.name} icon`} className="w-12 h-12 rounded-full border-2 border-gray-600" />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-gray-300">?</div>
                                )}
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white">
                                        {token.name || "Bilinmeyen Token"} 
                                        {token.symbol && (
                                          <span className="ml-2 text-sm text-gray-400 font-normal">
                                            ({token.symbol})
                                          </span>
                                        )}
                                    </h4>
                                    <p className="font-bold text-lg text-purple-400">
                                      {token.amount}
                                      {token.price !== null && token.price !== undefined && token.price > 0 && (
                                        <span className="ml-2 text-sm text-green-400 font-normal">
                                          (${ (token.amount * token.price).toFixed(2) })
                                        </span>
                                      )}
                                    </p>
                                    <p className="font-mono text-xs text-gray-400 mt-1">
                                      Mint: {token.mintAddress}
                                    </p>
                                </div>
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
