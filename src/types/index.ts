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

export type ServiceCategory = 
  | 'electrical'
  | 'plumbing'
  | 'carpentry'
  | 'appliance_repair'
  | 'general_maintenance';

export type DiagnosticStatus = 
  | 'pending'
  | 'analyzing'
  | 'diagnosed'
  | 'matched'
  | 'completed';
