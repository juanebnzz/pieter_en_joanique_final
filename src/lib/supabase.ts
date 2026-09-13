import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from 'astro:env/client';
import { SUPABASE_SECRET_KEY } from 'astro:env/server';
import type { Database } from './database.types';

/**
 * Server-only Supabase client using the secret key. Bypasses RLS, so it must
 * never be imported from anything that ships to the browser. Every table has
 * RLS enabled with no policies, so this is the *only* way in.
 */
let client: SupabaseClient<Database> | undefined;

export function supabaseAdmin(): SupabaseClient<Database> {
  if (!client) {
    if (!SUPABASE_SECRET_KEY) {
      throw new Error(
        'SUPABASE_SECRET_KEY is not set. Paste the sb_secret_… key from Supabase → Project Settings → API Keys into .env',
      );
    }
    client = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export type Tables = Database['public']['Tables'];
export type Household = Tables['households']['Row'];
export type Guest = Tables['guests']['Row'];
export type Payment = Tables['payments']['Row'];
export type HouseholdOverview = Database['public']['Views']['household_overview']['Row'];
export type RsvpStatus = Database['public']['Enums']['rsvp_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
