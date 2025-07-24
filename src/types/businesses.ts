 
 
import { FaLeaf, FaBitcoin, FaChartLine } from "react-icons/fa";
 


export const businesses = [
  {
    id: 1,
    title: "Agriculture",
    icon: FaLeaf,
    image: "/iceben-agriculture.jpg",
    description:
      "Accilent Finance Limited invests in innovative farming techniques and advanced agribusiness ventures. Our focus is on productivity, profitability, and sustainability in agriculture.",
  },
  {
    id: 2,
    title: "Crypto Mining",
    icon: FaBitcoin,
    image: "/iceben-crypto.jpg",
    description:
      "As pioneers in the digital currency revolution, we invest in cutting-edge crypto mining operations to maximize returns through strategic asset allocation and secure technology.",
  },
  {
    id: 3,
    title: "Stock Trading",
    icon: FaChartLine,
    image: "/iceben-stock.jpg",
    description:
      "Our stock trading platform uses real-time analytics and market insights to identify opportunities and generate consistent returns for our clients.",
  },
];




export  type CryptoType = 'BTC' | 'ETH' | 'BNB' | 'DOGE' | 'SOL' | 'USDT';

export type DepositInput = {
  planId: number;
  amount: number;
  cryptoType: CryptoType;
  transactionHash?: string;
};

export  type InvestmentPlan = {
  id: number;
  title: string;
  percentage: number;
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  interval: string;
  referralBonus: number;
};

export  type CryptoPaymentOption = {
  id: number;
  name: string;
  symbol: string;
  network: string;
  walletAddress: string;
};

export  type DepositStatus = 'pending' | 'completed' | 'rejected';

export  type Deposit = {
  id: string;
  amount: number;
  cryptoType: CryptoType;
  status: DepositStatus;
  reference: string;
  createdAt: string;
  processedAt?: string;
  transactionHash?: string;
  adminNotes?: string;
  planTitle?: string;
  userEmail?: string;
  username?: string;
};


// Withdrawal status types
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

// Input for initiating a withdrawal
export interface WithdrawalInput {
  amount: number;
  cryptoType: string;
  walletAddress: string;
}

// Withdrawal object
export interface Withdrawal {
  id: string;
  amount: number;
  cryptoType: string;
  status: WithdrawalStatus;
  reference: string;
  walletAddress: string;
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
  userEmail?: string;       // Only for admin views
  username?: string;        // Only for admin views
}

export type ProfileData = {
  name: string;
  username: string;
  referralCode: string;
  email: string;
  phoneNumber: string;
  balance: number;
};

export type UpdateInvestmentPlanInput = {
  id: number;
  title?: string;
  percentage?: number;
  min_amount?: number;
  max_amount?: number;
  duration_days?: number;
  interval?: string;
  referral_bonus?: number;
};

export type UpdateUserProfileInput = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  balance?: number;
};


export type Profile = {
  id: string;
  name: string;
  username: string;
  balance: number;
  email: string;
  phoneNumber: string;
};

export  type UpdateProfileInput = {
  name?: string
  username?: string
  email?: string
  phoneNumber?: string
  currentPassword?: string // Needed for email changes
}

// export type ProfileData = {
//   name: string
//   username: string
//   email: string
//   phoneNumber: string
// }

