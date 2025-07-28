// app/deri/layout.tsx
"use client"
import Link from "next/link";
import { ReactNode, useState } from "react";
import { AiFillTrademarkCircle } from "react-icons/ai";
import { FiUsers, FiUpload, FiDownload, FiMenu, FiX } from "react-icons/fi";
import { MdAccountBalanceWallet } from "react-icons/md";
 
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen md:flex-row">
      {/* Mobile Header with Hamburger Menu */}
      <header className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white focus:outline-none"
        >
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </header>

      {/* Sidebar - Hidden on mobile unless toggled */}
      <aside 
        className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-gray-900 text-white p-4 space-y-4`}
      >
        <h2 className="text-2xl font-bold mb-6 hidden md:block">Admin Panel</h2>
        <nav className="space-y-2">
          <Link 
            href="/deri" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiUsers /> All Users
          </Link>
          <Link 
            href="/deri/deposit" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiUpload /> All Deposits
          </Link>
          <Link 
            href="/deri/loan" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <MdAccountBalanceWallet /> Loans manage
          </Link>
          <Link 
            href="/deri/withdrawal" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiDownload /> All Withdrawals
          </Link>
          {/* <Link 
            href="/deri/all" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiDownload />Withdrawals Table
          </Link> */}
          {/* <Link 
            href="/deri/verification" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiFileText />User verification
          </Link> */}
          <Link 
            href="/deri/investment-plans" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <AiFillTrademarkCircle />Investment Plans Management

          </Link>
          {/* <Link 
            href="/deri/settings" 
            className="flex items-center hover:bg-gray-700 px-4 py-2 rounded gap-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiSettings /> Settings
          </Link> */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-4 md:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}