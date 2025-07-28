/* eslint-disable @next/next/no-img-element */
'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalculator, FaExchangeAlt, FaPercentage, FaClock  } from 'react-icons/fa';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';

const plans = [
  {
    title: "Starter",
    percentage: 5,
    min: 100,
    max: 5000,
    duration: "Three Days",
    interval: "Daily",
    referral: "10%",
  },
  {
    title: "Advanced",
    percentage: 8,
    min: 5000,
    max: 11500,
    duration: "Four Days",
    interval: "Daily",
    referral: "10%",
  },
  {
    title: "Professional",
    percentage: 10,
    min: 11500,
    max: 100000,
    duration: "Five Days",
    interval: "Daily",
    referral: "10%",
  },
];

type CryptoData = {
  id: string;
  name: string;
  current_price: number;
  image: string;
  symbol: string;
};

export default function InvestmentCalculator() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'converter'>('calculator');
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [investmentAmount, setInvestmentAmount] = useState(plans[0].min);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [fromCrypto, setFromCrypto] = useState('bitcoin');
  const [toCurrency, setToCurrency] = useState('usd');
  const [amount, setAmount] = useState(1);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate earnings
  const dailyEarnings = (investmentAmount * selectedPlan.percentage) / 100;
  const totalEarnings = dailyEarnings * (selectedPlan.title === "Starter" ? 3 : selectedPlan.title === "Advanced" ? 4 : 5);

  // Fetch crypto data
  useEffect(() => {
    const fetchCryptoData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false'
        );
        const data = await response.json();
        setCryptoData(data);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'converter') {
      fetchCryptoData();
    }
  }, [activeTab]);

  // Calculate crypto conversion
  useEffect(() => {
    if (cryptoData.length > 0 && activeTab === 'converter') {
      const fromCryptoData = cryptoData.find(crypto => crypto.id === fromCrypto);
      if (fromCryptoData) {
        const convertedValue = amount * fromCryptoData.current_price;
        setConvertedAmount(parseFloat(convertedValue.toFixed(2)));
      }
    }
  }, [amount, fromCrypto, cryptoData, activeTab]);

  const handlePlanSelect = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    // Adjust investment amount if it's outside the new plan's range
    if (investmentAmount < plan.min) setInvestmentAmount(plan.min);
    if (investmentAmount > plan.max) setInvestmentAmount(plan.max);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setInvestmentAmount(Math.min(Math.max(value, selectedPlan.min), selectedPlan.max));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Investment Tools</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate your potential earnings or convert between cryptocurrencies
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-6 py-3 rounded-md font-medium flex items-center transition-colors ${activeTab === 'calculator' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaCalculator className="mr-2" />
              Calculator
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`px-6 py-3 rounded-md font-medium flex items-center transition-colors ${activeTab === 'converter' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaExchangeAlt className="mr-2" />
              Crypto Converter
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'calculator' ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="grid md:grid-cols-3 gap-0">
                {/* Plan Selection */}
                <div className="p-6 bg-gray-50 border-r border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Choose Your Plan</h3>
                  <div className="space-y-4">
                    {plans.map((plan) => (
                      <motion.div
                        key={plan.title}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlanSelect(plan)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedPlan.title === plan.title ? 'bg-teal-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">{plan.title}</h4>
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${selectedPlan.title === plan.title ? 'bg-teal-700' : 'bg-teal-100 text-teal-800'}`}>
                            {plan.percentage}%
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="flex items-center">
                            <GiPayMoney className="mr-2" />
                            <span>Min: {formatCurrency(plan.min)}</span>
                          </div>
                          <div className="flex items-center">
                            <GiReceiveMoney className="mr-2" />
                            <span>Max: {formatCurrency(plan.max)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Calculator */}
                <div className="p-6 md:col-span-2">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Investment Calculator</h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Investment Amount ({formatCurrency(selectedPlan.min)} - {formatCurrency(selectedPlan.max)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min={selectedPlan.min}
                        max={selectedPlan.max}
                        value={investmentAmount}
                        onChange={handleAmountChange}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <div className="mt-2">
                        <input
                          type="range"
                          min={selectedPlan.min}
                          max={selectedPlan.max}
                          value={investmentAmount}
                          onChange={handleAmountChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-2">
                        <FaPercentage className="mr-2" />
                        <span className="text-sm font-medium">Daily Profit</span>
                      </div>
                      <div className="text-2xl font-bold text-teal-600">
                        {formatCurrency(dailyEarnings)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-2">
                        <FaClock className="mr-2" />
                        <span className="text-sm font-medium">Duration</span>
                      </div>
                      <div className="text-2xl font-bold text-teal-600">
                        {selectedPlan.duration}
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">Total Earnings:</span>
                      <span className="text-2xl font-bold text-teal-700">
                        {formatCurrency(totalEarnings)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Based on {selectedPlan.percentage}% daily for {selectedPlan.duration}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="converter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden p-6"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Crypto Converter</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                    <div className="flex space-x-4">
                      <select
                        value={fromCrypto}
                        onChange={(e) => setFromCrypto(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        {cryptoData.map((crypto) => (
                          <option key={crypto.id} value={crypto.id}>
                            {crypto.name} ({crypto.symbol.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4">
                      <input
                        type="number"
                        min="0"
                        step="0.00000001"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-4"
                    >
                      <option value="usd">US Dollar (USD)</option>
                      <option value="eur">Euro (EUR)</option>
                      <option value="gbp">British Pound (GBP)</option>
                    </select>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Converted Amount</div>
                      <div className="text-2xl font-bold text-teal-600">
                        {formatCurrency(convertedAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {cryptoData.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Popular Cryptocurrencies</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {cryptoData.slice(0, 5).map((crypto) => (
                      <motion.div
                        key={crypto.id}
                        whileHover={{ y: -5 }}
                        onClick={() => {
                          setFromCrypto(crypto.id);
                          setAmount(1);
                        }}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <img src={crypto.image} alt={crypto.name} className="w-6 h-6 mr-2" />
                          <span className="font-medium">{crypto.symbol.toUpperCase()}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {formatCurrency(crypto.current_price)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}