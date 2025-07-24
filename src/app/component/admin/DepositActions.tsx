"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaTimes, FaSpinner, FaSync } from "react-icons/fa";
import { approveDeposit, getAllDepositss, rejectDeposit } from "@/lib/investmentplan";

interface Deposit {
  id: string;
  amount: number;
  cryptoType: string;
  status: string;
  reference: string;
  createdAt: string;
  processedAt?: string;
  transactionHash?: string;
  adminNotes?: string;
  planTitle?: string;
  userEmail?: string;
  username?: string;
}

export default function DepositManager() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);

  const fetchDeposits = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getAllDepositss();
      if (error) {
        setError(error);
      } else if (data) {
        // Filter to only show pending deposits
        setDeposits(data.filter(deposit => deposit.status === "pending"));
      }
    } catch (err) {
      console.log(err);
      setError("Failed to fetch deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleApprove = async (depositId: string) => {
    setProcessingId(depositId);
    setError(null);
    try {
      const result = await approveDeposit(depositId);
      if (result.error) {
        setError(result.error);
      } else {
        // Remove the approved deposit from the list
        setDeposits(prev => prev.filter(deposit => deposit.id !== depositId));
      }
    } catch (err) {
      console.log(err);
      setError("Failed to approve deposit");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedDepositId) return;
    
    setProcessingId(selectedDepositId);
    setError(null);
    try {
      const result = await rejectDeposit(selectedDepositId, rejectReason);
      if (result.error) {
        setError(result.error);
      } else {
        // Remove the rejected deposit from the list
        setDeposits(prev => prev.filter(deposit => deposit.id !== selectedDepositId));
        setShowRejectModal(false);
        setRejectReason("");
      }
    } catch (err) {
      console.log(err);
      setError("Failed to reject deposit");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (depositId: string) => {
    setSelectedDepositId(depositId);
    setShowRejectModal(true);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Deposits</h1>
        <button
          onClick={fetchDeposits}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaSync />}
          Refresh
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No pending deposits found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Reference</th>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Plan</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Crypto</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => (
                <motion.tr
                  key={deposit.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{deposit.reference}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{deposit.username}</div>
                    <div className="text-sm text-gray-500">{deposit.userEmail}</div>
                  </td>
                  <td className="py-3 px-4">{deposit.planTitle}</td>
                  <td className="py-3 px-4">${deposit.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">{deposit.cryptoType}</td>
                  <td className="py-3 px-4">
                    {new Date(deposit.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(deposit.id)}
                        disabled={processingId === deposit.id}
                        className={`flex items-center gap-1 px-3 py-1 rounded ${
                          processingId === deposit.id
                            ? "bg-green-600"
                            : "bg-green-500 hover:bg-green-600"
                        } text-white text-sm`}
                      >
                        {processingId === deposit.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaCheck />
                        )}
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openRejectModal(deposit.id)}
                        disabled={processingId === deposit.id}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
                      >
                        <FaTimes />
                        Reject
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowRejectModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Reject Deposit</h2>
            <p className="mb-4">Please provide a reason for rejecting this deposit:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!processingId}
                className={`px-4 py-2 rounded text-white ${
                  !rejectReason.trim() || processingId
                    ? "bg-red-400"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {processingId ? (
                  <span className="flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Confirm Reject"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}