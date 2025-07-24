// data/businesses.ts
import { supabase } from "@/lib/supabaseClient";
import { FaLeaf, FaBitcoin, FaChartLine } from "react-icons/fa";
import nodemailer from "nodemailer";


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

export async function sendDepositApprovalEmail(userId: string, details: {
  amount: number;
  depositId: string;
  cryptoType: string;
}) {
  try {
    const { data: user } = await supabase
      .from('accilent_profile')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      console.error('No email found for user:', userId);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Accilent Finance Limited <${process.env.EMAIL_USERNAME}>`,
      to: user.email,
      subject: `Deposit of $${details.amount} Approved Successfully`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a52be;">Deposit Approved</h2>
          <p>Dear ${user.username || 'Valued Customer'},</p>
          
          <p>We are pleased to inform you that your deposit of 
          <strong>$${details.amount}</strong> in <strong>${details.cryptoType}</strong> 
          has been <strong>successfully approved</strong>.</p>
    
          <p><strong>Deposit ID:</strong> ${details.depositId}</p>
    
    
          <p>Your funds have been credited to your account and will now begin accruing returns based on your selected investment plan.</p>
    
          <p>If you have any questions or require further assistance, please don’t hesitate to contact us.</p>
    
          <p style="margin-top: 30px;">
            <strong>Accilent Finance Limited</strong><br>
            <a href="mailto:accillents@gmail.com">accillents@gmail.com</a><br>
            <em>Empowering Smart Investments</em>
          </p>
        </div>
      `,
    };
    

    await transporter.sendMail(mailOptions);
    console.log('Deposit approval email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send deposit approval email:', error);
  }
}

// Helper function to send deposit rejection email
export async function sendDepositRejectionEmail(userId: string, details: {
  amount: number;
  depositId: string;
  cryptoType: string;
  adminNotes: string;
}) {
  try {
    const { data: user } = await supabase
      .from('accilent_profile')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      console.error('No email found for user:', userId);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Accilent Finance Limited <${process.env.EMAIL_USERNAME}>`,
      to: user.email,
      subject: `Withdrawal of $${details.amount} Approved Successfully`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a52be;">Withdrawal Approved</h2>
          <p>Dear ${user.username || 'Valued Customer'},</p>
          
          <p>We are pleased to inform you that your withdrawal request of 
          <strong>$${details.amount}</strong> in <strong>${details.cryptoType}</strong> 
          has been <strong>successfully approved and processed</strong>.</p>
    
          <p><strong>Withdrawal ID:</strong> ${details.depositId || details.depositId}</p>
    
          ${details.adminNotes ? `
            <p><strong>Note from our team:</strong> ${details.adminNotes}</p>
          ` : ''}
    
          <p>The funds have been sent to your designated wallet address. Depending on the blockchain network, it may take a short time for the transaction to reflect.</p>
    
          <p>If you have any questions or require further clarification, feel free to reach out to our support team.</p>
    
          <p style="margin-top: 30px;">
            <strong>Accilent Finance Limited</strong><br>
            <a href="mailto:accillents@gmail.com">accillents@gmail.com</a><br>
            <em>Empowering Smart Investments</em>
          </p>
        </div>
      `,
    };
    
    

    await transporter.sendMail(mailOptions);
    console.log('Deposit rejection email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send deposit rejection email:', error);
  }
}
