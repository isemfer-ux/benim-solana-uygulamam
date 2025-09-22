// src/components/TokenList.tsx

'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import React, { useEffect, useState } from 'react';

// Token bilgilerini tutacak arayüzü (interface) tanımlıyoruz.
interface Token {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  logo: string;
}

const TokenList: React.FC = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTokens = async () => {
    if (!publicKey) {
      setTokens([]);
      return;
    }

    setLoading(true);
    try {
      // Helius API anahtarını ve URL'yi hazırlıyoruz.
      // Bu API, bir cüzdanın sahip olduğu tüm dijital varlıkları getirir.
      const heliusApiKey = '8e2fd160-d29c-452f-bfd5-507192363a1f'; // API anahtarını buraya koy
      const url = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: publicKey.toBase58(),
            page: 1,
            limit: 1000,
          },
        }),
      });

      const { result } = await response.json();
      
      // Gelen veriyi işleyip ihtiyacımız olan formata dönüştürüyoruz.
      const tokenList: Token[] = result.items
        .filter((item: any) => item.interface === 'FungibleToken' && item.token_info) // Sadece standart token'ları al
        .map((item: any) => ({
          mint: item.id,
          name: item.content?.metadata?.name || 'Bilinmeyen Token',
          symbol: item.content?.metadata?.symbol || '???',
          balance: item.token_info.balance / Math.pow(10, item.token_info.decimals),
          logo: item.content?.links?.image || 'https://arweave.net/W21kxje_bM6_4u-i_nrbd_H6_Zw_9Lw_Vr_f_uan9wA', // Varsayılan logo
        }));

      setTokens(tokenList);

    } catch (error) {
      console.error("Token'lar alınırken hata oluştu:", error);
      setTokens([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, [publicKey]);

  if (loading) {
    return <p className="text-center text-white mt-4">Token'lar yükleniyor...</p>;
  }

  if (tokens.length === 0) {
    return <p className="text-center text-gray-400 mt-4">Gösterilecek token bulunamadı.</p>;
  }

  return (
    <div className="p-4 bg-slate-800 rounded-xl shadow-lg mt-4 w-full">
      <h2 className="text-2xl font-bold mb-4 text-white text-center">Token Varlıklarım</h2>
      <ul className="divide-y divide-slate-700">
        {tokens.map((token) => (
          <li key={token.mint} className="flex items-center justify-between p-3">
            <div className="flex items-center">
              <img src={token.logo} alt={`${token.name} logo`} className="w-10 h-10 rounded-full mr-4 bg-gray-600" />
              <div>
                <p className="font-semibold text-white">{token.name}</p>
                <p className="text-sm text-gray-400">{token.symbol}</p>
              </div>
            </div>
            <p className="font-mono text-lg text-green-400">{token.balance.toFixed(4)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TokenList;