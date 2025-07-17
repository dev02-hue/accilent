"use server";
import { CryptoPaymentOption, Deposit, DepositInput, DepositStatus, InvestmentPlan } from "@/types/businesses";
import { getSession } from "./auth";
import { supabase } from "./supabaseClient";
import nodemailer from "nodemailer";
 
// Types


// Get all investment plans
export async function getInvestmentPlans(): Promise<{ data?: InvestmentPlan[]; error?: string }> {
  try {
    const { data: plans, error } = await supabase
      .from('investment_plans')
      .select('*')
      .order('min_amount', { ascending: true });

    if (error) {
      console.error('Error fetching investment plans:', error);
      return { error: 'Failed to fetch investment plans' };
    }

    return {
      data: plans?.map(plan => ({
        id: plan.id,
        title: plan.title,
        percentage: plan.percentage,
        minAmount: plan.min_amount,
        maxAmount: plan.max_amount,
        durationDays: plan.duration_days,
        interval: plan.interval,
        referralBonus: plan.referral_bonus
      })) || []
    };
  } catch (err) {
    console.error('Unexpected error in getInvestmentPlans:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Get all crypto payment options
export async function getCryptoPaymentOptions(): Promise<{ data?: CryptoPaymentOption[]; error?: string }> {
  try {
    const { data: options, error } = await supabase
      .from('crypto_payment_options')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching crypto payment options:', error);
      return { error: 'Failed to fetch payment options' };
    }

    return {
      data: options?.map(option => ({
        id: option.id,
        name: option.name,
        symbol: option.symbol,
        network: option.network,
        walletAddress: option.wallet_address
      })) || []
    };
  } catch (err) {
    console.error('Unexpected error in getCryptoPaymentOptions:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Initiate a deposit
export async function initiateDeposit({
  planId,
  amount,
  cryptoType,
  transactionHash
}: DepositInput): Promise<{ success?: boolean; error?: string; depositId?: string }> {
  try {
    // 1. Get current session
    const session = await getSession(); // Fixed: Removed destructuring since getSession might not return { session }
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    const userId = session.user.id;

    // 2. Validate amount against selected plan
    const { data: plan, error: planError } = await supabase
      .from('investment_plans')
      .select('min_amount, max_amount')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return { error: 'Invalid investment plan' };
    }

    if (amount < plan.min_amount || amount > plan.max_amount) {
      return { error: `Amount must be between $${plan.min_amount} and $${plan.max_amount} for this plan` };
    }

    // 3. Get wallet address for selected crypto
    const { data: cryptoOption, error: cryptoError } = await supabase
      .from('crypto_payment_options')
      .select('wallet_address')
      .eq('symbol', cryptoType)
      .single();

    if (cryptoError || !cryptoOption) {
      return { error: 'Invalid cryptocurrency selected' };
    }

    // 4. Generate reference
    const reference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const narration = `Investment deposit for plan ${planId}`;

    // 5. Create deposit record
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert([{
        user_id: userId,
        plan_id: planId,
        amount,
        crypto_type: cryptoType,
        wallet_address: cryptoOption.wallet_address,
        transaction_hash: transactionHash,
        reference,
        narration
      }])
      .select()
      .single();

    if (depositError || !deposit) {
      console.error('Error creating deposit:', depositError);
      return { error: 'Failed to initiate deposit' };
    }

    // 6. Notify admin
    await sendDepositNotificationToAdmin({
      userId,
      userEmail: session.user.email || '',
      amount,
      planId,
      cryptoType,
      reference,
      depositId: deposit.id,
      walletAddress: cryptoOption.wallet_address,
      transactionHash
    });

    return { success: true, depositId: deposit.id };
  } catch (err) {
    console.error('Unexpected error in initiateDeposit:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Send deposit notification to admin
async function sendDepositNotificationToAdmin(params: {
  userId: string;
  userEmail: string;
  amount: number;
  planId: number;
  cryptoType: string;
  reference: string;
  depositId: string;
  walletAddress: string;
  transactionHash?: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Get plan title for email
    const { data: plan } = await supabase
      .from('investment_plans')
      .select('title')
      .eq('id', params.planId)
      .single();

    const mailOptions = {
      from: `Your App Name <${process.env.EMAIL_USERNAME}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Deposit Request - ${params.amount} ${params.cryptoType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a52be;">New Deposit Request</h2>
          <p><strong>User ID:</strong> ${params.userId}</p>
          <p><strong>User Email:</strong> ${params.userEmail}</p>
          <p><strong>Plan:</strong> ${plan?.title || params.planId}</p>
          <p><strong>Amount:</strong> ${params.amount}</p>
          <p><strong>Crypto Type:</strong> ${params.cryptoType}</p>
          <p><strong>Wallet Address:</strong> ${params.walletAddress}</p>
          ${params.transactionHash ? `<p><strong>Transaction Hash:</strong> ${params.transactionHash}</p>` : ''}
          <p><strong>Reference:</strong> ${params.reference}</p>
          
          <div style="margin-top: 30px;">
            <a href="${process.env.ADMIN_URL}/deposits/${params.depositId}/approve" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Approve Deposit
            </a>
            <a href="${process.env.ADMIN_URL}/deposits/${params.depositId}/reject" 
               style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">
              Reject Deposit
            </a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

// Approve a deposit
export async function approveDeposit(depositId: string): Promise<{ success?: boolean; error?: string; currentStatus?: string }> {
  try {
    // 1. Verify deposit exists and is pending
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('status, user_id, amount, plan_id')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      console.error('Deposit fetch failed:', fetchError);
      return { error: 'Deposit not found' };
    }

    if (deposit.status !== 'pending') {
      return { 
        error: 'Deposit already processed',
        currentStatus: deposit.status 
      };
    }

    // 2. Update status to completed (trigger will handle balance update)
    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', depositId);

    if (updateError) {
      console.error('Approval failed:', updateError);
      return { error: 'Failed to approve deposit' };
    }

    // 3. Send confirmation to user
    await sendDepositConfirmationToUser(deposit.user_id, deposit.amount, depositId);

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in approveDeposit:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Reject a deposit
export async function rejectDeposit(depositId: string, adminNotes: string = ''): Promise<{ success?: boolean; error?: string; currentStatus?: string }> {
  try {
    // 1. Verify deposit exists and is pending
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('status')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      console.error('Deposit fetch failed:', fetchError);
      return { error: 'Deposit not found' };
    }

    if (deposit.status !== 'pending') {
      return { 
        error: 'Deposit already processed',
        currentStatus: deposit.status 
      };
    }

    // 2. Update status to rejected
    const { error: updateError } = await supabase
      .from('deposits')
      .update({ 
        status: 'rejected',
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', depositId);

    if (updateError) {
      console.error('Rejection failed:', updateError);
      return { error: 'Failed to reject deposit' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in rejectDeposit:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Get user deposits
export async function getUserDeposits(
  filters: {
    status?: DepositStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Deposit[]; error?: string; count?: number }> {
  try {
    // 1. Get current session
    const session = await getSession();
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    const userId = session.user.id;

    // 2. Build base query
    let query = supabase
      .from('deposits')
      .select(`
        id,
        amount,
        crypto_type,
        status,
        reference,
        created_at,
        processed_at,
        transaction_hash,
        investment_plans!inner(title)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset !== undefined && filters.limit) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }

    // 4. Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching deposits:', error);
      return { error: 'Failed to fetch deposits' };
    }

    return {
        data: data?.map(deposit => ({
            id: deposit.id,
            amount: deposit.amount,
            cryptoType: deposit.crypto_type,
            status: deposit.status,
            reference: deposit.reference,
            createdAt: deposit.created_at,
            processedAt: deposit.processed_at,
            transactionHash: deposit.transaction_hash,
            planTitle: deposit.investment_plans[0]?.title 
          })),
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getUserDeposits:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Get all deposits (admin)
export async function getAllDeposits(
  filters: {
    status?: DepositStatus;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Deposit[]; error?: string; count?: number }> {
  try {
    // 1. Build base query
    let query = supabase
      .from('deposits')
      .select(`
        id,
        amount,
        crypto_type,
        status,
        reference,
        created_at,
        processed_at,
        transaction_hash,
        admin_notes,
        investment_plans!inner(title),
        accilent_profile!inner(email, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 2. Apply filters
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

    // 3. Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching deposits:', error);
      return { error: 'Failed to fetch deposits' };
    }

    return {
        data: data?.map(deposit => ({
            id: deposit.id,
            amount: deposit.amount,
            cryptoType: deposit.crypto_type,
            status: deposit.status,
            reference: deposit.reference,
            createdAt: deposit.created_at,
            processedAt: deposit.processed_at,
            transactionHash: deposit.transaction_hash,
            adminNotes: deposit.admin_notes,
            planTitle: deposit.investment_plans[0]?.title, // Access first element of array
            userEmail: deposit.accilent_profile[0]?.email, // Access first element of array
            username: deposit.accilent_profile[0]?.username // Access first element of array
          })),
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getAllDeposits:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Helper function to send deposit confirmation to user
async function sendDepositConfirmationToUser(userId: string, amount: number, depositId: string) {
  try {
    const { data: user } = await supabase
      .from('accilent_profile')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user?.email) return;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Your App Name <${process.env.EMAIL_USERNAME}>`,
      to: user.email,
      subject: `Deposit of $${amount} Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a52be;">Deposit Approved</h2>
          <p>Your deposit of <strong>$${amount}</strong> has been approved and your account has been credited.</p>
          <p>Deposit ID: ${depositId}</p>
          <p>Thank you for investing with us!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send deposit confirmation:', error);
  }
}