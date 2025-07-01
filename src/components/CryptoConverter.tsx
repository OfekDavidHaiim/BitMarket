import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

interface CryptoPrices {
  ETH: number;
  BTC: number;
  USDT: number;
}

interface CryptoConverterProps {
  amount: number;
  fromCurrency: string;
  className?: string;
}

const CryptoConverter: React.FC<CryptoConverterProps> = ({ amount, fromCurrency, className = '' }) => {
  const [prices, setPrices] = useState<CryptoPrices>({ ETH: 2000, BTC: 50000, USDT: 1 });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Simulate live price updates
    const interval = setInterval(() => {
      setPrices(prev => ({
        ETH: prev.ETH + (Math.random() - 0.5) * 50,
        BTC: prev.BTC + (Math.random() - 0.5) * 1000,
        USDT: 1
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const convertToUSD = (amount: number, currency: string): number => {
    return amount * (prices[currency as keyof CryptoPrices] || 1);
  };

  const usdValue = convertToUSD(amount, fromCurrency);

  const conversions = [
    { currency: 'ETH', value: usdValue / prices.ETH },
    { currency: 'BTC', value: usdValue / prices.BTC },
    { currency: 'USDT', value: usdValue / prices.USDT }
  ].filter(c => c.currency !== fromCurrency);

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {amount} {fromCurrency}
          </div>
          <div className="text-lg text-gray-600">
            ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
        >
          <ArrowUpDown className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {showDetails && (
        <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Equivalent in other currencies:</h4>
          {conversions.map(conversion => (
            <div key={conversion.currency} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600">{conversion.currency}</span>
              <span className="text-sm font-medium text-gray-900">
                {conversion.value.toFixed(conversion.currency === 'USDT' ? 2 : 6)}
              </span>
            </div>
          ))}
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Live prices • Updated every 10 seconds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoConverter;