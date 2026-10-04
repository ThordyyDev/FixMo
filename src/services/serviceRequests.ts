import { supabase } from './supabase';
import {
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestFilter,
  ServiceCategory,
  Profile,
  WorkerProfile,
} from '@/types';

/**
 * Standard PostgREST select query string including related category and profile metadata.
 */
const SERVICE_REQUEST_SELECT_QUERY = `
  id,
  seeker_id,
  worker_id,
  category_id,
  description,
  image_path,
  service_address,
  preferred_schedule,
  status,
  created_at,
  updated_at,
  category:service_categories (
    id,
    name,
    description,
    icon,
    is_active,
    created_at,
    updated_at
  ),
  seeker:profiles (
    id,
    username,
    full_name,
    phone,
    avatar_url,
    role,
    created_at,
    updated_at
  ),
  worker:worker_profiles (
    id,
    bio,
    experience_years,
    service_area,
    availability_status,
    verification_status,
    verified_at,
    created_at,
    updated_at
  )
`;

/**
 * Internal raw row type returned by PostgREST query.
 */
interface ServiceRequestRow {
  id: string;
  seeker_id: string;
  worker_id: string;
  category_id: string;
  description: string;
  image_path: string | null;
  service_address: string;
  preferred_schedule: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory | ServiceCategory[] | null;
  seeker?: Profile | Profile[] | null;
  worker?: WorkerProfile | WorkerProfile[] | null;
}

/**
 * Maps a raw PostgREST row into a strongly typed ServiceRequest domain object.
 */
const mapServiceRequestRow = (row: ServiceRequestRow): ServiceRequest => {
  return {
    id: row.id,
    seeker_id: row.seeker_id,
    worker_id: row.worker_id,
    category_id: row.category_id,
    description: row.description,
    image_path: row.image_path ?? null,
    service_address: row.service_address,
    preferred_schedule: row.preferred_schedule ?? null,
    status: row.status as ServiceRequestStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: Array.isArray(row.category)
      ? row.category[0]
      : row.category || undefined,
    seeker: Array.isArray(row.seeker)
      ? row.seeker[0]
      : row.seeker || undefined,
    worker: Array.isArray(row.worker)
      ? row.worker[0]
      : row.worker || undefined,
  };
};

/**
 * Human-readable display labels for service request status values.
 */
export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  on_the_way: 'On the Way',
  arrived: 'Arrived',
  in_service: 'In Service',
  completed: 'Completed',
};

/**
 * Determines whether a service request is in a terminal/closed state.
 */
export const isTerminalStatus = (status: ServiceRequestStatus): boolean => {
  return status === 'completed' || status === 'cancelled' || status === 'rejected';
};

/**
 * Determines whether a service request is active (in-progress or awaiting action).
 */
export const isActiveStatus = (status: ServiceRequestStatus): boolean => {
  return !isTerminalStatus(status);
};

/**
 * Retrieves all service requests created by the currently authenticated seeker.
 * Results are ordered by created_at descending (newest first).
 *
 * @param seekerId - Optional user ID of the seeker. If omitted, uses the current authenticated session user ID.
 * @param options - Optional filters (e.g. status, category).
 */
export const getSeekerServiceRequests = async (
  seekerId?: string,
  options?: ServiceRequestFilter
): Promise<{ data: ServiceRequest[]; error: Error | null }> => {
  try {
    const targetSeekerId = seekerId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetSeekerId) {
      return {
        data: [],
        error: new Error('Authentication required. Please sign in to view your service requests.'),
      };
    }

    let query = supabase
      .from('service_requests')
      .select(SERVICE_REQUEST_SELECT_QUERY)
      .eq('seeker_id', targetSeekerId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    const { data, error } = await query;

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo ServiceRequests] Fetch seeker requests error:', error.message);
      }
      return {
        data: [],
        error: new Error(sanitizeServiceRequestError(error)),
      };
    }

    const requests: ServiceRequest[] = (
      (data as unknown as ServiceRequestRow[]) || []
    ).map(mapServiceRequestRow);

    return {
      data: requests,
      error: null,
    };
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn('[FixMo ServiceRequests] Unexpected error in getSeekerServiceRequests:', err);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to retrieve service requests.';
    return {
      data: [],
      error: new Error(message),
    };
  }
};

/**
 * Retrieves all service requests assigned to the currently authenticated worker.
 * Results are ordered by created_at descending (newest first).
 *
 * @param workerId - Optional user ID of the worker. If omitted, uses the current authenticated session user ID.
 * @param options - Optional filters (e.g. status, category).
 */
export const getWorkerServiceRequests = async (
  workerId?: string,
  options?: ServiceRequestFilter
): Promise<{ data: ServiceRequest[]; error: Error | null }> => {
  try {
    const targetWorkerId = workerId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetWorkerId) {
      return {
        data: [],
        error: new Error('Authentication required. Please sign in to view assigned service requests.'),
      };
    }

    let query = supabase
      .from('service_requests')
      .select(SERVICE_REQUEST_SELECT_QUERY)
      .eq('worker_id', targetWorkerId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    const { data, error } = await query;

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo ServiceRequests] Fetch worker requests error:', error.message);
      }
      return {
        data: [],
        error: new Error(sanitizeServiceRequestError(error)),
      };
    }

    const requests: ServiceRequest[] = (
      (data as unknown as ServiceRequestRow[]) || []
    ).map(mapServiceRequestRow);

    return {
      data: requests,
      error: null,
    };
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn('[FixMo ServiceRequests] Unexpected error in getWorkerServiceRequests:', err);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to retrieve worker service requests.';
    return {
      data: [],
      error: new Error(message),
    };
  }
};

/**
 * Retrieves a single service request by its ID.
 * Access is restricted by Supabase Row-Level Security: only the seeker or assigned worker can read it.
 * If the user does not have permission or if the record does not exist, returns data: null without error.
 *
 * @param requestId - Unique UUID of the service request.
 */
export const getServiceRequestById = async (
  requestId: string
): Promise<{ data: ServiceRequest | null; error: Error | null }> => {
  if (!requestId || !requestId.trim()) {
    return {
      data: null,
      error: new Error('Service Request ID is required.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(SERVICE_REQUEST_SELECT_QUERY)
      .eq('id', requestId.trim())
      .maybeSingle();

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo ServiceRequests] Fetch request by ID error:', error.message);
      }
      return {
        data: null,
        error: new Error(sanitizeServiceRequestError(error)),
      };
    }

    if (!data) {
      return {
        data: null,
        error: null,
      };
    }

    const request: ServiceRequest = mapServiceRequestRow(
      data as unknown as ServiceRequestRow
    );

    return {
      data: request,
      error: null,
    };
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn('[FixMo ServiceRequests] Unexpected error in getServiceRequestById:', err);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to retrieve service request.';
    return {
      data: null,
      error: new Error(message),
    };
  }
};

/**
 * Sanitizes technical PostgreSQL/PostgREST error codes and messages into user-friendly feedback.
 */
function sanitizeServiceRequestError(error: { code?: string; message?: string } | null): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = (error.message || '').toLowerCase();

  // Row Level Security / permission denied
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Permission denied. You can only access your own service requests.';
  }

  // Foreign key violation
  if (code === '23503' || message.includes('foreign key')) {
    return 'Referenced record was not found or is invalid.';
  }

  return 'Unable to process service request. Please check your connection and try again.';
}
