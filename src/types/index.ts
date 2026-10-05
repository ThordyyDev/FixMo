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
  role?: 'seeker' | 'worker';
}

export interface AdminUpdateWorkerVerificationResult {
  worker_id: string;
  verification_status: WorkerVerificationStatus;
  verified_at: string | null;
  updated_at: string;
}

export interface PendingWorkerItem {
  id: string;
  bio: string | null;
  experience_years: number | null;
  service_area: string | null;
  availability_status: WorkerAvailabilityStatus;
  verification_status: WorkerVerificationStatus;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
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

export type WorkerAvailabilityStatus = 'available' | 'unavailable';
export type WorkerVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

/**
 * FixMo Worker Profile model mapped to public.worker_profiles in Supabase.
 */
export interface WorkerProfile {
  id: string;
  bio: string | null;
  experience_years: number | null;
  service_area: string | null;
  availability_status: WorkerAvailabilityStatus;
  verification_status: WorkerVerificationStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkerProfileInput {
  bio?: string | null;
  experience_years?: number | null;
  service_area?: string | null;
  availability_status?: WorkerAvailabilityStatus;
}

export interface UpdateWorkerProfileInput {
  bio?: string | null;
  experience_years?: number | null;
  service_area?: string | null;
  availability_status?: WorkerAvailabilityStatus;
}

/**
 * FixMo Worker Service model mapped to public.worker_services in Supabase.
 */
export interface WorkerService {
  id: string;
  worker_id: string;
  category_id: string;
  service_description: string | null;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
}

export interface CreateWorkerServiceInput {
  category_id: string;
  service_description?: string | null;
}

export interface UpdateWorkerServiceInput {
  service_description?: string | null;
}

/**
 * FixMo Worker Discovery model mapped to public.worker_discovery view in Supabase.
 * Read-only view of verified skilled workers.
 */
export interface WorkerDiscoveryProfile {
  worker_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  experience_years: number | null;
  service_area: string | null;
  availability_status: WorkerAvailabilityStatus;
  verification_status: WorkerVerificationStatus;
  verified_at: string | null;
  services?: WorkerService[];
}

export interface WorkerDiscoveryFilter {
  categoryId?: string | null;
  serviceArea?: string | null;
  searchQuery?: string | null;
}

/**
 * Allowed service request statuses in public.service_requests.
 */
export type ServiceRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'on_the_way'
  | 'arrived'
  | 'in_service'
  | 'completed';

/**
 * FixMo Service Request model mapped to public.service_requests table in Supabase.
 */
export interface ServiceRequest {
  id: string;
  seeker_id: string;
  worker_id: string;
  category_id: string;
  description: string;
  image_path: string | null;
  service_address: string;
  preferred_schedule: string | null;
  status: ServiceRequestStatus;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
  seeker?: Profile;
  worker?: WorkerProfile;
}

/**
 * Input parameters for creating a new service request.
 * Note: seeker_id is always derived from the authenticated session,
 * and status is always initialized to 'pending'.
 */
export interface CreateServiceRequestInput {
  workerId: string;
  categoryId: string;
  description: string;
  serviceAddress: string;
  imagePath?: string | null;
  preferredSchedule?: string | null;
}

/**
 * Filter options for querying service requests.
 */
export interface ServiceRequestFilter {
  status?: ServiceRequestStatus;
  categoryId?: string;
}

