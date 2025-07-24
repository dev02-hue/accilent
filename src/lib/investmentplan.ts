"use server";
import { CryptoPaymentOption, Deposit, DepositInput, DepositStatus, InvestmentPlan,   UpdateInvestmentPlanInput } from "@/types/businesses";
import { getSession } from "./auth";
import { supabase } from "./supabaseClient";
import nodemailer from "nodemailer";
import { redirect } from "next/navigation";
import { processReferralBonus } from "./referral";

  async function sendDepositApprovalEmail(userId: string, details: {
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
 async function sendDepositRejectionEmail(userId: string, details: {
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


export async function updateInvestmentPlan(input: UpdateInvestmentPlanInput): Promise<{ success: boolean; error?: string }> {
  try {
    const { id, ...updateFields } = input;

    const { error } = await supabase
      .from('investment_plans')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString() // optional: set an updated timestamp
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating investment plan:', error);
      return { success: false, error: 'Failed to update investment plan' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in updateInvestmentPlan:', err);
    return { success: false, error: 'An unexpected error occurred' };
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

export async function initiateDeposit({
  planId,
  amount,
  cryptoType,
  transactionHash
}: DepositInput): Promise<{ success?: boolean; error?: string; depositId?: string }> {
  try {
    console.log('[initiateDeposit] Starting deposit process with params:', {
      planId,
      amount,
      cryptoType,
      transactionHash: transactionHash ? 'provided' : 'not provided'
    });

    // 1. Get current session
    console.log('[initiateDeposit] Getting user session...');
    const session = await getSession();
    if (!session?.user) {
      console.warn('[initiateDeposit] No authenticated user found');
      if (typeof window !== 'undefined') {
                window.location.href = '/signin';
              } else {
                redirect('/signin');  
              }
      return { error: 'Not authenticated' };
    }
    console.log('[initiateDeposit] User authenticated:', session.user.id);

    const userId = session.user.id;

    // 2. Validate amount against selected plan
    console.log(`[initiateDeposit] Validating plan ${planId} and amount ${amount}...`);
    const { data: plan, error: planError } = await supabase
      .from('investment_plans')
      .select('min_amount, max_amount')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('[initiateDeposit] Plan validation failed:', planError || 'Plan not found');
      return { error: 'Invalid investment plan' };
    }
    console.log('[initiateDeposit] Plan validated:', plan);

    if (amount < plan.min_amount || amount > plan.max_amount) {
      console.warn(`[initiateDeposit] Amount ${amount} outside plan range (${plan.min_amount}-${plan.max_amount})`);
      return { error: `Amount must be between $${plan.min_amount} and $${plan.max_amount} for this plan` };
    }
    console.log('[initiateDeposit] Amount validated');

    // 3. Get wallet address for selected crypto
    console.log(`[initiateDeposit] Getting wallet address for ${cryptoType}...`);
    const { data: cryptoOption, error: cryptoError } = await supabase
      .from('crypto_payment_options')
      .select('wallet_address')
      .eq('symbol', cryptoType)
      .single();

    if (cryptoError || !cryptoOption) {
      console.error('[initiateDeposit] Crypto validation failed:', cryptoError || 'Crypto option not found');
      return { error: 'Invalid cryptocurrency selected' };
    }
    console.log('[initiateDeposit] Wallet address retrieved');

    // 4. Generate reference
    const reference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const narration = `Investment deposit for plan ${planId}`;
    console.log('[initiateDeposit] Generated reference:', reference);

    // 5. Create deposit record
    console.log('[initiateDeposit] Creating deposit record...');
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
      console.error('[initiateDeposit] Deposit creation failed:', depositError);
      return { error: 'Failed to initiate deposit' };
    }
    console.log('[initiateDeposit] Deposit created successfully:', deposit.id);

    // 6. Notify admin
    console.log('[initiateDeposit] Sending admin notification...');
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
    console.log('[initiateDeposit] Admin notification sent');

    console.log('[initiateDeposit] Deposit process completed successfully');
    return { success: true, depositId: deposit.id };
  } catch (err) {
    console.error('[initiateDeposit] Unexpected error:', err);
    return { error: 'An unexpected error occurred' };
  }
}

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
    console.log('[sendDepositNotificationToAdmin] Preparing email notification for deposit:', params.depositId);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Get plan title for email
    console.log('[sendDepositNotificationToAdmin] Fetching plan details...');
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

    console.log('[sendDepositNotificationToAdmin] Sending email...');
    await transporter.sendMail(mailOptions);
    console.log('[sendDepositNotificationToAdmin] Email sent successfully');
  } catch (error) {
    console.error('[sendDepositNotificationToAdmin] Failed to send email:', error);
  }
}
// Approve a deposit
export async function approveDeposit(depositId: string): Promise<{ success?: boolean; error?: string; currentStatus?: string }> {
  try {
    // 1. Verify deposit exists and is pending
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('status, user_id, amount, plan_id, crypto_type')
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

    // 2. Process referral bonus if this is the user's first deposit
    if (deposit.amount > 0) {
      const { error: referralError } = await processReferralBonus(deposit.user_id, deposit.amount);
      if (referralError) {
        console.error('Referral bonus processing failed:', referralError);
        // Continue with deposit approval even if referral bonus fails
      }
    }

    // 3. Update status to completed (trigger will handle balance update)
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

    // 4. Send confirmation to user
    await sendDepositApprovalEmail(deposit.user_id, {
      amount: deposit.amount,
      depositId,
      cryptoType: deposit.crypto_type
    });

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
      .select('status, user_id, amount, plan_id, crypto_type')
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

    // 3. Send rejection notification to user
    await sendDepositRejectionEmail(deposit.user_id, {
      amount: deposit.amount,
      depositId,
      cryptoType: deposit.crypto_type,
      adminNotes
    });

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
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      } else {
        redirect('/signin'); // for use in server-side functions (Next.js App Router only)
      }
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


export async function getAllDepositss(): Promise<{ data?: Deposit[]; error?: string }> {
  try {
    // Execute simple query to get all deposits
    const { data, error } = await supabase
      .from('deposits')  // Changed from 'getAllDeposits' to 'deposits'
      .select(`
        id,
        amount,
        crypto_type,
        status,
        reference,
        created_at,
        processed_at,
        transaction_hash,
        admin_notes
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deposits:', error);
      return { error: 'Failed to fetch deposits' };
    }

    // Simplify the data mapping
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
        adminNotes: deposit.admin_notes
      }))
    };
  } catch (err) {
    console.error('Unexpected error in getAllDeposits:', err);
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

 