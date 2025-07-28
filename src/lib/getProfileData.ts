"use server";
import nodemailer from "nodemailer";
import { cookies } from "next/headers"
import { supabase } from "./supabaseClient"
import { getSession } from "./auth"
import { Deposit, DepositStatus, Profile, UpdateProfileInput, UpdateUserProfileInput, Withdrawal, WithdrawalStatus } from "@/types/businesses";
import { redirect } from "next/navigation";




 type ProfileData = {
    name: string
    username: string
    email: string
    phoneNumber: string
  }
  

  export async function updateUserProfile(input: UpdateUserProfileInput): Promise<{ success: boolean; error?: string }> {
    try {
      const { session } = await getSession();
      if (!session?.user) {
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        } else {
          redirect('/signin');
        }
        return { success: false, error: 'Not authenticated' };
      }
  
      const { id, name, username, email, phoneNumber, balance } = input;
  
      const { error } = await supabase
        .from('accilent_profile')
        .update({
          name,
          username,
          email,
          phone_number: phoneNumber,
          balance,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
  
      if (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: 'Failed to update profile' };
      }
  
      return { success: true };
    } catch (err) {
      console.error('Unexpected error in updateUserProfile:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
 
  
  export async function getAllProfiles(): Promise<{ data?: Profile[]; error?: string }> {
    try {
      // 1. Ensure user is authenticated
      const { session } = await getSession();
      if (!session?.user) {
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        } else {
          redirect('/signin');
        }
        return { error: 'Not authenticated' };
      }
  
      // 2. Fetch all profiles
      const { data: profiles, error } = await supabase
        .from('accilent_profile')
        .select('id, name, username, email, phone_number, balance');
  
      if (error || !profiles) {
        console.error('Error fetching all profiles:', error);
        return { error: 'Failed to fetch profiles' };
      }
  
      // 3. Return formatted profiles
      const formatted = profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        balance: profile.balance || 0, // Default to 0 if balance is null
        phoneNumber: profile.phone_number,
      }));
  
      return { data: formatted };
    } catch (err) {
      console.error('Unexpected error in getAllProfiles:', err);
      return { error: 'An unexpected error occurred' };
    }
  }
   
  /**
   * Fetches the current user's profile data
   */
  export async function getProfileData(): Promise<{ data?: ProfileData; error?: string }> {
    try {
      // 1. Get current session
      const { session } = await getSession()
      if (!session?.user) {
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        } else {
          redirect('/signin'); // for use in server-side functions (Next.js App Router only)
        }
        return { error: 'Not authenticated' }
      }
  
      // 2. Fetch profile data
      const { data: profile, error } = await supabase
        .from('accilent_profile')
        .select('name, username, email, phone_number')
        .eq('id', session.user.id)
        .single()
  
      if (error || !profile) {
        console.error('Error fetching profile:', error)
        return { error: 'Failed to fetch profile data' }
      }
  
      // 3. Return formatted data
      return {
        data: {
          name: profile.name,
          username: profile.username,
          email: profile.email,
          phoneNumber: profile.phone_number,
        },
      }
    } catch (err) {
      console.error('Unexpected error in getProfileData:', err)
      return { error: 'An unexpected error occurred' }
    }
  }
  
  /**
   * Updates the user's profile information
   */
  export async function updateProfile({
    name,
    username,
    email,
    phoneNumber,
    currentPassword,
  }: UpdateProfileInput): Promise<{ success?: boolean; error?: string }> {
    try {
      // 1. Get current session
      const { session } = await getSession()
      if (!session?.user) {
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        } else {
          redirect('/signin'); // for use in server-side functions (Next.js App Router only)
        }
        return { error: 'Not authenticated' }
      }
  
      const userId = session.user.id
      const updates: Partial<{
        name: string
        username: string
        email: string
        phone_number: string
        updated_at: string
      }> = {}
      let requiresReauth = false
  
      // 2. Prepare updates
      if (name !== undefined) updates.name = name
      if (username !== undefined) updates.username = username
      if (phoneNumber !== undefined) updates.phone_number = phoneNumber
      
      // Email changes require special handling
      if (email !== undefined && email !== session.user.email) {
        if (!currentPassword) {
          return { error: 'Current password is required to change email' }
        }
  
        // Verify current password
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: session.user.email || '',
          password: currentPassword,
        })
  
        if (verifyError) {
          return { error: 'Current password is incorrect' }
        }
  
        updates.email = email
        requiresReauth = true
      }
  
      // 3. Check for username/email/phone conflicts if they're being updated
      if (username || email || phoneNumber) {
        const conditions = []
        if (username) conditions.push(`username.eq.${username}`)
        if (email) conditions.push(`email.eq.${email}`)
        if (phoneNumber) conditions.push(`phone_number.eq.${phoneNumber}`)
  
        const { data: existingUsers, error: lookupError } = await supabase
          .from('accilent_profile')
          .select('username, email, phone_number')
          .or(conditions.join(','))
          .neq('id', userId)
  
        if (lookupError) {
          console.error('User lookup error:', lookupError)
          return { error: 'Error checking existing users' }
        }
  
        if (existingUsers && existingUsers.length > 0) {
          if (username && existingUsers.some(u => u.username === username)) {
            return { error: 'Username already taken' }
          }
          if (email && existingUsers.some(u => u.email === email)) {
            return { error: 'Email already registered' }
          }
          if (phoneNumber && existingUsers.some(u => u.phone_number === phoneNumber)) {
            return { error: 'Phone number already registered' }
          }
        }
      }
  
      // 4. Update profile in database if there are changes
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
  
        const { error: updateError } = await supabase
          .from('accilent_profile')
          .update(updates)
          .eq('id', userId)
  
        if (updateError) {
          console.error('Error updating profile:', updateError)
          return { error: 'Failed to update profile' }
        }
  
        // 5. If email was changed, update auth and send verification
        if (email && requiresReauth) {
          const { error: emailError } = await supabase.auth.updateUser({
            email,
          })
  
          if (emailError) {
            console.error('Error updating auth email:', emailError)
            return { error: 'Failed to update email. Please try again.' }
          }
  
          // Send verification email
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
              },
            })
  
            await transporter.sendMail({
              from: process.env.EMAIL_FROM,
              to: email,
              subject: 'Verify your new email address',
              html: `
                <p>Hello ${name || session.user.user_metadata.name},</p>
                <p>You've updated your email address for your Accilent account.</p>
                <p>Please check your inbox for a verification email from Supabase to complete the process.</p>
              `,
            })
          } catch (emailError) {
            console.error('Failed to send verification email:', emailError)
            // Not critical, so we continue
          }
        }
  
        // 6. Update session cookies if username changed
        if (username) {
          const cookieStore =await cookies()
          cookieStore.set('username', username, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 31536000, // 1 year
            path: '/',
            sameSite: 'lax',
          })
        }
      }
  
      return { success: true }
    } catch (err) {
      console.error('Unexpected error in updateProfile:', err)
      return { error: 'An unexpected error occurred' }
    }
  }


  export async function getUserTransactions(
    type: 'deposits' | 'withdrawals',
    filters: {
      status?: DepositStatus | WithdrawalStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data?: (Deposit | Withdrawal)[]; error?: string; count?: number }> {
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
  
      // 2. Build base query based on transaction type
      let query;
      
      if (type === 'deposits') {
        query = supabase
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
          .eq('user_id', userId);
      } else {
        query = supabase
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
          .eq('user_id', userId);
      }
  
      // Apply common ordering
      query = query.order('created_at', { ascending: false });
  
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
        console.error(`Error fetching ${type}:`, error);
        return { error: `Failed to fetch ${type}` };
      }
  
      // 5. Transform data based on type
      let transformedData;
      if (type === 'deposits') {
        transformedData = data?.map(transaction => ({
          id: transaction.id,
          amount: transaction.amount,
          cryptoType: transaction.crypto_type,
          status: transaction.status,
          reference: transaction.reference,
          createdAt: transaction.created_at,
          processedAt: transaction.processed_at,
          // transactionHash: transaction.transaction_hash,
          // planTitle: transaction.investment_plans[0]?.title 
        }));
      } else {
        transformedData = data?.map(transaction => ({
          id: transaction.id,
          amount: transaction.amount,
          cryptoType: transaction.crypto_type,
          status: transaction.status,
          reference: transaction.reference,
          createdAt: transaction.created_at,
          processedAt: transaction.processed_at,
          // walletAddress: transaction.wallet_address,
          // adminNotes: transaction.admin_notes
        }));
      }
  
      return {
        data: transformedData,
        count: count || 0
      };
    } catch (err) {
      console.error(`Unexpected error in getUserTransactions (${type}):`, err);
      return { error: 'An unexpected error occurred' };
    }
  }