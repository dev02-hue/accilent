"use server";

import { getSession } from "./auth";
import { supabase } from "./supabaseClient";
import nodemailer from "nodemailer";
import { redirect } from "next/navigation";

// Types
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
export type LoanRepaymentInterval = 'weekly' | 'bi-weekly' | 'monthly';

export interface LoanPlan {
  id: string;
  title: string;
  interest: number;
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  repaymentInterval: LoanRepaymentInterval;
}

export interface Loan {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  status: LoanStatus;
  reference: string;
  createdAt: string;
  approvedAt?: string;
  dueDate?: string;
  interestAmount: number;
  totalRepaymentAmount: number;
  // repaymentSchedule: RepaymentSchedule[];
  adminNotes?: string;
  planTitle?: string;
  userEmail?: string;
  username?: string;
  purpose?: string;
}

export interface RepaymentSchedule {
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface LoanInput {
  planId: string;
  amount: number;
  purpose?: string;
}

// Loan Plans Data
const loanPlans: LoanPlan[] = [
  {
    id: '1',
    title: "Quick Loan",
    interest: 5,
    minAmount: 100,
    maxAmount: 2000,
    durationDays: 30,
    repaymentInterval: 'weekly'
  },
  {
    id: '2',
    title: "Standard Loan",
    interest: 8,
    minAmount: 2000,
    maxAmount: 10000,
    durationDays: 90,
    repaymentInterval: 'monthly'
  },
  {
    id: '3',
    title: "Business Boost",
    interest: 12,
    minAmount: 10000,
    maxAmount: 50000,
    durationDays: 180,
    repaymentInterval: 'monthly'
  }
];

// Helper Functions
async function sendLoanApprovalEmail(userId: string, details: {
  amount: number;
  loanId: string;
  totalRepayment: number;
  dueDate: string;
}) {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('No email found for user:', userId, error);
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
      subject: `Loan of $${details.amount} Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a52be;">Loan Approved</h2>
          <p>Dear ${user.username || 'Valued Customer'},</p>
          
          <p>We are pleased to inform you that your loan request of 
          <strong>$${details.amount}</strong> has been <strong>approved</strong>.</p>
    
          <p><strong>Loan ID:</strong> ${details.loanId}</p>
          <p><strong>Total Repayment Amount:</strong> $${details.totalRepayment}</p>
          <p><strong>Due Date:</strong> ${details.dueDate}</p>
    
          <p>The approved amount has been credited to your account balance.</p>
    
          <p>Please ensure you make your repayments on time to avoid penalties.</p>
    
          <p style="margin-top: 30px;">
            <strong>Accilent Finance Limited</strong><br>
            <a href="mailto:accillents@gmail.com">accillents@gmail.com</a><br>
            <em>Empowering Your Financial Growth</em>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Loan approval email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send loan approval email:', error);
  }
}

async function sendLoanRejectionEmail(userId: string, details: {
  amount: number;
  loanId: string;
  adminNotes: string;
}) {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('No email found for user:', userId, error);
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
      subject: `Loan Request of $${details.amount} Declined`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a52be;">Loan Request Declined</h2>
          <p>Dear ${user.username || 'Valued Customer'},</p>
          
          <p>We regret to inform you that your loan request of 
          <strong>$${details.amount}</strong> has been <strong>declined</strong>.</p>
    
          <p><strong>Loan ID:</strong> ${details.loanId}</p>
    
          ${details.adminNotes ? `
            <p><strong>Reason:</strong> ${details.adminNotes}</p>
          ` : ''}
    
          <p>If you have any questions or would like to discuss alternative options, 
          please don't hesitate to contact our support team.</p>
    
          <p style="margin-top: 30px;">
            <strong>Accilent Finance Limited</strong><br>
            <a href="mailto:accillents@gmail.com">accillents@gmail.com</a><br>
            <em>Empowering Your Financial Growth</em>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Loan rejection email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send loan rejection email:', error);
  }
}

async function sendLoanNotificationToAdmin(params: {
  userId: string;
  userEmail: string;
  amount: number;
  planId: string;
  loanId: string;
  purpose?: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const plan = loanPlans.find(p => p.id === params.planId);

    const mailOptions = {
      from: `Accilent Finance Limited <${process.env.EMAIL_USERNAME}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Loan Request - $${params.amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a52be;">New Loan Request</h2>
          <p><strong>User ID:</strong> ${params.userId}</p>
          <p><strong>User Email:</strong> ${params.userEmail}</p>
          <p><strong>Loan Plan:</strong> ${plan?.title || params.planId}</p>
          <p><strong>Amount:</strong> $${params.amount}</p>
          ${params.purpose ? `<p><strong>Purpose:</strong> ${params.purpose}</p>` : ''}
          <p><strong>Loan ID:</strong> ${params.loanId}</p>
          
          <div style="margin-top: 30px;">
            <a href="${process.env.ADMIN_URL}/loans/${params.loanId}/approve" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Approve Loan
            </a>
            <a href="${process.env.ADMIN_URL}/loans/${params.loanId}/reject" 
               style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">
              Reject Loan
            </a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Loan notification email sent to admin');
  } catch (error) {
    console.error('Failed to send loan notification email:', error);
  }
}

function calculateRepaymentSchedule(plan: LoanPlan, amount: number, approvalDate: Date): RepaymentSchedule[] {
  const totalInterest = (amount * plan.interest) / 100;
  const totalRepayment = amount + totalInterest;
  
  const schedule: RepaymentSchedule[] = [];
  const durationDays = plan.durationDays;
  
  if (plan.repaymentInterval === 'weekly') {
    const weeks = Math.ceil(durationDays / 7);
    const weeklyAmount = totalRepayment / weeks;
    
    for (let i = 1; i <= weeks; i++) {
      const dueDate = new Date(approvalDate);
      dueDate.setDate(dueDate.getDate() + (i * 7));
      schedule.push({
        dueDate: dueDate.toISOString(),
        amount: parseFloat(weeklyAmount.toFixed(2)),
        status: 'pending'
      });
    }
  } else if (plan.repaymentInterval === 'monthly') {
    const months = Math.ceil(durationDays / 30);
    const monthlyAmount = totalRepayment / months;
    
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(approvalDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        dueDate: dueDate.toISOString(),
        amount: parseFloat(monthlyAmount.toFixed(2)),
        status: 'pending'
      });
    }
  } else { // bi-weekly
    const periods = Math.ceil(durationDays / 14);
    const periodAmount = totalRepayment / periods;
    
    for (let i = 1; i <= periods; i++) {
      const dueDate = new Date(approvalDate);
      dueDate.setDate(dueDate.getDate() + (i * 14));
      schedule.push({
        dueDate: dueDate.toISOString(),
        amount: parseFloat(periodAmount.toFixed(2)),
        status: 'pending'
      });
    }
  }
  
  return schedule;
}

// Main Functions
export async function getLoanPlans(): Promise<{ data?: LoanPlan[]; error?: string }> {
  try {
    return { data: loanPlans };
  } catch (err) {
    console.error('Unexpected error in getLoanPlans:', err);
    return { error: 'An unexpected error occurred' };
  }
}



export async function initiateLoan(input: LoanInput): Promise<{ success?: boolean; error?: string; loanId?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      } else {
        redirect('/signin');
      }
      return { error: 'Not authenticated' };
    }

    const userId = session.user.id;
    const plan = loanPlans.find(p => p.id === input.planId);
    if (!plan) {
      return { error: 'Invalid loan plan' };
    }

    if (input.amount < plan.minAmount || input.amount > plan.maxAmount) {
      return { error: `Amount must be between $${plan.minAmount} and $${plan.maxAmount} for this plan` };
    }

    const reference = `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const interestAmount = (input.amount * plan.interest) / 100;
    const totalRepaymentAmount = input.amount + interestAmount;

    const { data: loan, error: loanError } = await supabase
    .from('loans')
    .insert([{
      user_id: userId,
      plan_id: input.planId,
      amount: input.amount,
      status: 'pending',
      reference,
      purpose: input.purpose,
      interest_amount: interestAmount,
      total_repayment: totalRepaymentAmount,
      total_repayment_amount: totalRepaymentAmount,
      interest_rate: plan.interest 
    }])
    .select()
    .single();
  

    if (loanError || !loan) {
      console.error('Loan creation failed:', loanError);
      return { error: 'Failed to initiate loan' };
    }

    await sendLoanNotificationToAdmin({
      userId,
      userEmail: session.user.email || '',
      amount: input.amount,
      planId: input.planId,
      loanId: loan.id,
      purpose: input.purpose
    });

    return { success: true, loanId: loan.id };
  } catch (err) {
    console.error('Unexpected error in initiateLoan:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function approveLoan(loanId: string): Promise<{ success?: boolean; error?: string; currentStatus?: string }> {
  try {
    const { data: loan, error: fetchError } = await supabase
      .from('loans')
      .select('status, user_id, amount, plan_id, interest_amount, total_repayment_amount')
      .eq('id', loanId)
      .single();

    if (fetchError || !loan) {
      console.error('Loan fetch failed:', fetchError);
      return { error: 'Loan not found' };
    }

    if (loan.status !== 'pending') {
      return { 
        error: 'Loan already processed',
        currentStatus: loan.status 
      };
    }

    const plan = loanPlans.find(p => p.id === loan.plan_id);
    if (!plan) {
      return { error: 'Loan plan not found' };
    }

    const approvalDate = new Date();
    const dueDate = new Date(approvalDate);
    dueDate.setDate(dueDate.getDate() + plan.durationDays);
    
    const repaymentSchedule = calculateRepaymentSchedule(plan, loan.amount, approvalDate);

    const { error: updateError } = await supabase
      .from('loans')
      .update({ 
        status: 'approved',
        approved_at: approvalDate.toISOString(),
        due_date: dueDate.toISOString(),
        repayment_schedule: repaymentSchedule
      })
      .eq('id', loanId);

    if (updateError) {
      console.error('Approval failed:', updateError);
      return { error: 'Failed to approve loan' };
    }

    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id: loan.user_id,
      amount: loan.amount
    });

    if (balanceError) {
      console.error('Balance update failed:', balanceError);
      return { error: 'Failed to update user balance' };
    }

    await sendLoanApprovalEmail(loan.user_id, {
      amount: loan.amount,
      loanId,
      totalRepayment: loan.total_repayment_amount,
      dueDate: dueDate.toDateString()
    });

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in approveLoan:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function rejectLoan(loanId: string, adminNotes: string = ''): Promise<{ success?: boolean; error?: string; currentStatus?: string }> {
  try {
    const { data: loan, error: fetchError } = await supabase
      .from('loans')
      .select('status, user_id, amount')
      .eq('id', loanId)
      .single();

    if (fetchError || !loan) {
      console.error('Loan fetch failed:', fetchError);
      return { error: 'Loan not found' };
    }

    if (loan.status !== 'pending') {
      return { 
        error: 'Loan already processed',
        currentStatus: loan.status 
      };
    }

    const { error: updateError } = await supabase
      .from('loans')
      .update({ 
        status: 'rejected',
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', loanId);

    if (updateError) {
      console.error('Rejection failed:', updateError);
      return { error: 'Failed to reject loan' };
    }

    await sendLoanRejectionEmail(loan.user_id, {
      amount: loan.amount,
      loanId,
      adminNotes
    });

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in rejectLoan:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getUserLoans(
  filters: {
    status?: LoanStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Loan[]; error?: string; count?: number }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      } else {
        redirect('/signin');
      }
      return { error: 'Not authenticated' };
    }

    const userId = session.user.id;

    let query = supabase
      .from('loans')
      .select(`
        id,
        user_id,
        plan_id,
        amount,
        status,
        reference,
        created_at,
        approved_at,
        due_date,
        interest_amount,
        total_repayment_amount,
        repayment_schedule,
        admin_notes,
        purpose,
        loan_plans:plan_id (title)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset !== undefined && filters.limit) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching loans:', error);
      return { error: 'Failed to fetch loans' };
    }

    const mappedData = data?.map(loan => ({
      id: loan.id,
      userId: loan.user_id,
      planId: loan.plan_id,
      amount: loan.amount,
      status: loan.status,
      reference: loan.reference,
      createdAt: loan.created_at,
      approvedAt: loan.approved_at,
      dueDate: loan.due_date,
      interestAmount: loan.interest_amount,
      totalRepaymentAmount: loan.total_repayment_amount,
      repaymentSchedule: loan.repayment_schedule || [],
      adminNotes: loan.admin_notes,
      purpose: loan.purpose,
      planTitle: (loan.loan_plans as unknown as { title: string })?.title,
    })) || [];

    return {
      data: mappedData,
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getUserLoans:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getAllLoans(
  filters: {
    status?: LoanStatus;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Loan[]; error?: string; count?: number }> {
  try {
    let query = supabase
      .from('loans')
      .select(`
        id,
        user_id,
        plan_id,
        amount,
        status,
        reference,
        created_at,
        approved_at,
        due_date,
        interest_amount,
        total_repayment_amount,
       
        admin_notes,
        purpose,
        loan_plans:plan_id (title),
        profiles:user_id (email, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset !== undefined && filters.limit) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching loans:', error);
      return { error: 'Failed to fetch loans' };
    }

    const mappedData = data?.map(loan => ({
      id: loan.id,
      userId: loan.user_id,
      planId: loan.plan_id,
      amount: loan.amount,
      status: loan.status,
      reference: loan.reference,
      createdAt: loan.created_at,
      approvedAt: loan.approved_at,
      dueDate: loan.due_date,
      interestAmount: loan.interest_amount,
      totalRepaymentAmount: loan.total_repayment_amount,
      // repaymentSchedule: loan.repayment_schedule || [],
      adminNotes: loan.admin_notes,
      purpose: loan.purpose,
      planTitle: (loan.loan_plans as unknown as { title: string })?.title,
      userEmail: (loan.profiles as unknown as { email: string })?.email,
      username: (loan.profiles as unknown as { username: string })?.username
    })) || [];

    return {
      data: mappedData,
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getAllLoans:', err);
    return { error: 'An unexpected error occurred' };
  }
}