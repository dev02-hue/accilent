"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaCalendarAlt, FaPercentage, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { initiateLoan, getLoanPlans, LoanPlan, LoanInput } from '@/lib/loan';

export default function LoanApplication() {
  const [selectedPlan, setSelectedPlan] = useState<LoanPlan | null>(null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loanPlans, setLoanPlans] = useState<LoanPlan[]>([]);

  // Fetch loan plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await getLoanPlans();
      if (error) {
        setError(error);
      } else if (data) {
        setLoanPlans(data);
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedPlan) {
      setError('Please select a loan plan');
      setLoading(false);
      return;
    }

    const loanInput: LoanInput = {
      planId: selectedPlan.id,
      amount: parseFloat(amount),
      purpose: purpose || undefined
    };

    const result = await initiateLoan(loanInput);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(`Loan application submitted successfully! Reference: ${result.loanId}`);
      setSelectedPlan(null);
      setAmount('');
      setPurpose('');
    }

    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-black sm:text-4xl">
            Apply for a Loan
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Choose from our flexible loan plans tailored to your needs
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700"
          >
            <div className="flex items-center">
              <FaTimesCircle className="mr-2" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700"
          >
            <div className="flex items-center">
              <FaCheckCircle className="mr-2" />
              <p>{success}</p>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 md:grid-cols-2"
        >
          {/* Loan Plans */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-semibold text-black">Available Plans</h2>
            {loanPlans.length === 0 ? (
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-600">Loading loan plans...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loanPlans.map((plan) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={plan.id}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <h3 className="text-lg font-bold text-black">{plan.title}</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-gray-700">
                        <FaPercentage className="mr-2 text-green-600" />
                        <span>Interest: {plan.interest}%</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <FaMoneyBillWave className="mr-2 text-green-600" />
                        <span>
                          Amount: ${plan.minAmount} - ${plan.maxAmount}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <FaCalendarAlt className="mr-2 text-green-600" />
                        <span>
                          Duration: {plan.durationDays} days ({plan.repaymentInterval})
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Application Form */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-semibold text-black">Application Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Loan Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                    placeholder="0.00"
                    min={selectedPlan?.minAmount || 0}
                    max={selectedPlan?.maxAmount || 100000}
                    required
                    disabled={!selectedPlan}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="text-gray-500 sm:text-sm mr-3">USD</span>
                  </div>
                </div>
                {selectedPlan && (
                  <p className="mt-2 text-sm text-gray-500">
                    Must be between ${selectedPlan.minAmount} and ${selectedPlan.maxAmount}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                  Purpose (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="purpose"
                    name="purpose"
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                    placeholder="Briefly describe what you need the loan for..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !selectedPlan}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || !selectedPlan
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  {loading ? 'Processing...' : 'Submit Application'}
                </motion.button>
              </div>
            </form>

            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-black mb-2">Loan Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Principal:</span>
                    <span className="font-medium">${amount || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest ({selectedPlan.interest}%):</span>
                    <span className="font-medium">
                      ${amount ? ((parseFloat(amount) * selectedPlan.interest) / 100).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Total Repayment:</span>
                    <span className="font-bold text-green-600">
  ${amount ? (parseFloat(amount) + (parseFloat(amount) * selectedPlan.interest / 100)).toFixed(2) : '0.00'}
</span>

                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}