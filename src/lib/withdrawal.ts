"use server";
import { Withdrawal, WithdrawalInput, WithdrawalStatus } from "@/types/businesses";
import { getSession } from "./auth";
import { supabase } from "./supabaseClient";
import { sendWithdrawalNotificationToAdmin } from "./email";
import { redirect } from "next/navigation";
import nodemailer from "nodemailer";

 

  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Initiate a withdrawal request
export async function initiateWithdrawal({
    amount,
    cryptoType,
    walletAddress
  }: WithdrawalInput): Promise<{ success?: boolean; error?: string; withdrawalId?: string }> {
    try {
      console.log('[initiateWithdrawal] Starting withdrawal process with params:', {
        amount,
        cryptoType,
        walletAddress
      });
  
      // 1. Get current session
      console.log('[initiateWithdrawal] Getting user session...');
      const session = await getSession();
      if (!session?.user) {
        console.warn('[initiateWithdrawal] No authenticated user found');
        if (typeof window !== 'undefined') {
                  window.location.href = '/signin';
                } else {
                  redirect('/signin'); // for use in server-side functions (Next.js App Router only)
                }
        return { error: 'Not authenticated' };
      }
      console.log('[initiateWithdrawal] User authenticated:', session.user.id);
  
      const userId = session.user.id;
  
      // 2. Check user balance
      console.log('[initiateWithdrawal] Checking user balance...');
      const { data: profile, error: profileError } = await supabase
        .from('accilent_profile')
        .select('balance')
        .eq('id', userId)
        .single();
  
      if (profileError || !profile) {
        console.error('[initiateWithdrawal] Failed to fetch user balance:', profileError);
        return { error: 'Failed to fetch user balance' };
      }
  
      if (profile.balance < amount) {
        console.warn(`[initiateWithdrawal] Insufficient balance (${profile.balance} < ${amount})`);
        return { error: 'Insufficient balance for withdrawal' };
      }
  
      // 3. Validate minimum withdrawal amount
      const MIN_WITHDRAWAL = 10;
      if (amount < MIN_WITHDRAWAL) {
        console.warn(`[initiateWithdrawal] Amount ${amount} below minimum ${MIN_WITHDRAWAL}`);
        return { error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}` };
      }
  
      // 4. Generate reference
      const reference = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const narration = `Withdrawal request for ${amount}`;
      console.log('[initiateWithdrawal] Generated reference:', reference);
  
      // 5. Create withdrawal record
      console.log('[initiateWithdrawal] Creating withdrawal record...');
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert([{
          user_id: userId,
          amount,
          crypto_type: cryptoType,
          wallet_address: walletAddress,
          reference,
          narration,
          status: 'pending'
        }])
        .select()
        .single();
  
      if (withdrawalError || !withdrawal) {
        console.error('[initiateWithdrawal] Withdrawal creation failed:', withdrawalError);
        return { error: 'Failed to initiate withdrawal' };
      }
      console.log('[initiateWithdrawal] Withdrawal created successfully:', withdrawal.id);
  
      // 6. Notify admin
      console.log('[initiateWithdrawal] Sending admin notification...');
      await sendWithdrawalNotificationToAdmin({
        userId,
        userEmail: session.user.email || '',
        amount,
        cryptoType,
        walletAddress,
        reference,
        withdrawalId: withdrawal.id
      });
      console.log('[initiateWithdrawal] Admin notification sent');
  
      console.log('[initiateWithdrawal] Withdrawal process completed successfully');
      return { success: true, withdrawalId: withdrawal.id };
    } catch (err) {
      console.error('[initiateWithdrawal] Unexpected error:', err);
      return { error: 'An unexpected error occurred' };
    }
  }

// Approve a withdrawal
export async function approveWithdrawal(withdrawalId: string): Promise<{ success?: boolean; error?: string; currentStatus?: string }> {
  try {
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('status, user_id, amount, crypto_type')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return { error: 'Withdrawal not found' };
    }

    if (withdrawal.status !== 'pending') {
      return { error: 'Withdrawal already processed', currentStatus: withdrawal.status };
    }

    const { data: profile, error: profileError } = await supabase
      .from('accilent_profile')
      .select('balance, email, username')
      .eq('id', withdrawal.user_id)
      .single();

    if (profileError || !profile) {
      return { error: 'Failed to fetch user profile' };
    }

    if (profile.balance < withdrawal.amount) {
      return { error: 'User has insufficient balance' };
    }

    const { error: processingError } = await supabase
      .from('withdrawals')
      .update({
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (processingError) {
      return { error: 'Failed to process withdrawal' };
    }

    const { error: balanceError } = await supabase.rpc('decrement_balance', {
      user_id: withdrawal.user_id,
      amount: withdrawal.amount
    });

    if (balanceError) {
      await supabase
        .from('withdrawals')
        .update({ status: 'pending' })
        .eq('id', withdrawalId);
      return { error: 'Failed to update user balance' };
    }

    const { error: completeError } = await supabase
      .from('withdrawals')
      .update({ status: 'completed' })
      .eq('id', withdrawalId);

    if (completeError) {
      return { error: 'Failed to complete withdrawal' };
    }

    // ✅ Send approval email
    await transporter.sendMail({
      from: `Accilent Finance Limited <${process.env.EMAIL_USERNAME}>`,
      to: profile.email,
      subject: `Withdrawal of $${withdrawal.amount} Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #2a52be;">Withdrawal Approved</h2>
          <p>Dear ${profile.username || 'Valued Customer'},</p>
          <p>Your withdrawal of <strong>$${withdrawal.amount}</strong> in <strong>${withdrawal.crypto_type}</strong> has been successfully approved and processed.</p>
          <p>If you have any questions, feel free to contact support.</p>
          <br>
          <p>Accilent Finance Limited<br><a href="mailto:accillents@gmail.com">accillents@gmail.com</a></p>
        </div>
      `
    });

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in approveWithdrawal:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Reject a withdrawal
export async function rejectWithdrawal(withdrawalId: string, adminNotes: string = ''): Promise<{ success?: boolean; error?: string; currentStatus?: string }> {
  try {
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('status, user_id, amount, crypto_type')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return { error: 'Withdrawal not found' };
    }

    if (withdrawal.status !== 'pending') {
      return { error: 'Withdrawal already processed', currentStatus: withdrawal.status };
    }

    const { data: profile, error: profileError } = await supabase
      .from('accilent_profile')
      .select('email, username')
      .eq('id', withdrawal.user_id)
      .single();

    if (profileError || !profile) {
      return { error: 'Failed to fetch user profile' };
    }

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', withdrawalId);

    if (updateError) {
      return { error: 'Failed to reject withdrawal' };
    }

    // ✅ Send rejection email
    await transporter.sendMail({
      from: `Accilent Finance Limited <${process.env.EMAIL_USERNAME}>`,
      to: profile.email,
      subject: `Withdrawal of $${withdrawal.amount} Rejected`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #c0392b;">Withdrawal Rejected</h2>
          <p>Dear ${profile.username || 'Valued Customer'},</p>
          <p>Unfortunately, your withdrawal request of <strong>$${withdrawal.amount}</strong> in <strong>${withdrawal.crypto_type}</strong> was not approved.</p>
          ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ''}
          <p>You may try again or contact support for more information.</p>
          <br>
          <p>Accilent Finance Limited<br><a href="mailto:accillents@gmail.com">accillents@gmail.com</a></p>
        </div>
      `
    });

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in rejectWithdrawal:', err);
    return { error: 'An unexpected error occurred' };
  }
}


// Get user withdrawals
export async function getUserWithdrawals(
  filters: {
    status?: WithdrawalStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Withdrawal[]; error?: string; count?: number }> {
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
      .from('withdrawals')
      .select(`
        id,
        amount,
        crypto_type,
        status,
        reference,
        created_at,
        processed_at,
        wallet_address,
        admin_notes
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
      console.error('Error fetching withdrawals:', error);
      return { error: 'Failed to fetch withdrawals' };
    }

    return {
      data: data?.map(withdrawal => ({
        id: withdrawal.id,
        amount: withdrawal.amount,
        cryptoType: withdrawal.crypto_type,
        status: withdrawal.status,
        reference: withdrawal.reference,
        createdAt: withdrawal.created_at,
        processedAt: withdrawal.processed_at,
        walletAddress: withdrawal.wallet_address,
        adminNotes: withdrawal.admin_notes
      })),
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getUserWithdrawals:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Get all withdrawals (admin)
export async function getAllWithdrawals(
  filters: {
    status?: WithdrawalStatus;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Withdrawal[]; error?: string; count?: number }> {
  try {
    // 1. Build base query
    let query = supabase
      .from('withdrawals')
      .select(`
        id,
        amount,
        crypto_type,
        status,
        reference,
        created_at,
        processed_at,
        wallet_address,
        admin_notes,
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
      console.error('Error fetching withdrawals:', error);
      return { error: 'Failed to fetch withdrawals' };
    }

    return {
      data: data?.map(withdrawal => ({
        id: withdrawal.id,
        amount: withdrawal.amount,
        cryptoType: withdrawal.crypto_type,
        status: withdrawal.status,
        reference: withdrawal.reference,
        createdAt: withdrawal.created_at,
        processedAt: withdrawal.processed_at,
        walletAddress: withdrawal.wallet_address,
        adminNotes: withdrawal.admin_notes,
        userEmail: withdrawal.accilent_profile[0]?.email,
        username: withdrawal.accilent_profile[0]?.username
      })),
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getAllWithdrawals:', err);
    return { error: 'An unexpected error occurred' };
  }
}

 
