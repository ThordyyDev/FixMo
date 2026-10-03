/**
 * FixMo Shared TypeScript Types & Interfaces
 * 
 * Defines core domain models for the FixMo Capstone Project.
 */

export type UserRole = 'seeker' | 'worker' | 'admin';

export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  barangay: 'Tinago';
  createdAt: string;
}

/**
 * FixMo User Profile model mapped to public.profiles table in Supabase.
 */
export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  id: string;
  username: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: string;
}

export interface UpdateProfileInput {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

/**
 * FixMo Service Category model mapped to public.service_categories in Supabase.
 */
export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DiagnosticStatus = 
  | 'pending'
  | 'analyzing'
  | 'diagnosed'
  | 'matched'
  | 'completed';
