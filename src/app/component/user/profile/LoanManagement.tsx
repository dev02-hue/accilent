"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaSearch , FaSync } from 'react-icons/fa';
import { getAllLoans, approveLoan, rejectLoan, Loan, LoanStatus } from '@/lib/loan';

export default function LoanManagement() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '' as LoanStatus | '',
    search: '',
  });
  const [count, setCount] = useState(0);

  // Fetch loans with filters
  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error, count } = await getAllLoans({
        status: filters.status as LoanStatus,
      });
      
      if (error) {
        setError(error);
      } else if (data) {
        // Filter by search term if provided
        const filteredData = filters.search 
          ? data.filter(loan => 
              loan.reference.toLowerCase().includes(filters.search.toLowerCase()) ||
              loan.userEmail?.toLowerCase().includes(filters.search.toLowerCase()) ||
              loan.username?.toLowerCase().includes(filters.search.toLowerCase())
            )
          : data;
        
        setLoans(filteredData);
        setCount(count || filteredData.length);
      }
    } catch (err) {
      setError('Failed to fetch loans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLoans();
  }, [filters.status]);

  // Handle loan approval
  const handleApprove = async (loanId: string) => {
    if (!confirm('Are you sure you want to approve this loan?')) return;
    
    setLoading(true);
    try {
      const { success, error } = await approveLoan(loanId);
      if (error) {
        setError(error);
      } else if (success) {
        fetchLoans(); // Refresh the list
      }
    } catch (err) {
      setError('Failed to approve loan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle loan rejection
  const handleReject = async (loanId: string) => {
    const adminNotes = prompt('Please enter the reason for rejection:');
    if (adminNotes === null) return; // User cancelled
    
    setLoading(true);
    try {
      const { success, error } = await rejectLoan(loanId, adminNotes);
      if (error) {
        setError(error);
      } else if (success) {
        fetchLoans(); // Refresh the list
      }
    } catch (err) {
      setError('Failed to reject loan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: LoanStatus }) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      defaulted: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black sm:text-4xl">
            Loan Management
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Review and manage all loan applications
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by reference, email, or name..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={filters.search}
                onChange={(e) => {
                  setFilters({...filters, search: e.target.value});
                  // Trigger search after a small delay
                  setTimeout(fetchLoans, 300);
                }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as LoanStatus | ''})}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="defaulted">Defaulted</option>
              </select>
              
              <button
                onClick={fetchLoans}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <FaSync className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}

        {/* Loans Table */}
        {!loading && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.length > 0 ? (
                    loans.map((loan) => (
                      <motion.tr
                        key={loan.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <p className="font-medium">{loan.username}</p>
                            <p className="text-gray-400">{loan.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loan.planTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${loan.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <StatusBadge status={loan.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {loan.status === 'pending' && (
                            <div className="flex justify-end space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApprove(loan.id)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md flex items-center"
                              >
                                <FaCheck className="mr-1" /> Approve
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReject(loan.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md flex items-center"
                              >
                                <FaTimes className="mr-1" /> Reject
                              </motion.button>
                            </div>
                          )}
                          {loan.status === 'approved' && (
                            <span className="text-green-600 italic">Approved</span>
                          )}
                          {loan.status === 'rejected' && (
                            <span className="text-red-600 italic">Rejected</span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No loans found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Count and summary */}
        {!loading && (
          <div className="mt-4 text-sm text-gray-500">
            Showing {loans.length} of {count} loans
          </div>
        )}
      </div>
    </div>
  );
}