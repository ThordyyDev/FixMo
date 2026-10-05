import { supabase } from './supabase';
import {
  WorkerDiscoveryProfile,
  WorkerService,
} from '@/types';

/**
 * Retrieves all verified workers from public.worker_discovery,
 * along with the service categories they offer from public.worker_services.
 * 
 * Never exposes private user data (email, phone, etc.).
 */
export const getVerifiedWorkers = async (
  options?: {
    serviceArea?: string;
    categoryId?: string;
  }
): Promise<{ data: WorkerDiscoveryProfile[]; error: Error | null }> => {
  try {
    let query = supabase
      .from('worker_discovery')
      .select(`
        worker_id,
        username,
        full_name,
        avatar_url,
        bio,
        experience_years,
        service_area,
        availability_status,
        verification_status,
        verified_at
      `)
      .order('full_name', { ascending: true, nullsFirst: false });

    if (options?.serviceArea && options.serviceArea.trim()) {
      query = query.ilike('service_area', `%${options.serviceArea.trim()}%`);
    }

    const { data: workersData, error: workersError } = await query;

    if (workersError) {
      if (__DEV__) {
        console.warn('[FixMo Discovery] Fetch workers error:', workersError.message);
      }
      return {
        data: [],
        error: new Error(sanitizeDiscoveryError(workersError)),
      };
    }

    const workers: WorkerDiscoveryProfile[] = (workersData || []) as WorkerDiscoveryProfile[];

    if (workers.length === 0) {
      return { data: [], error: null };
    }

    // Batch fetch associated worker services and categories
    const workerIds = workers.map((w) => w.worker_id);
    const { data: servicesData, error: servicesError } = await supabase
      .from('worker_services')
      .select(`
        id,
        worker_id,
        category_id,
        service_description,
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
        )
      `)
      .in('worker_id', workerIds);

    if (servicesError && __DEV__) {
      console.warn('[FixMo Discovery] Fetch services note:', servicesError.message);
    }

    // Map services to worker IDs
    const servicesByWorker: Record<string, WorkerService[]> = {};
    (servicesData || []).forEach((item: any) => {
      const s: WorkerService = {
        id: item.id,
        worker_id: item.worker_id,
        category_id: item.category_id,
        service_description: item.service_description,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: Array.isArray(item.category) ? item.category[0] : item.category || undefined,
      };

      if (!servicesByWorker[item.worker_id]) {
        servicesByWorker[item.worker_id] = [];
      }
      servicesByWorker[item.worker_id].push(s);
    });

    // Attach services to worker profiles
    const enrichedWorkers = workers.map((worker) => ({
      ...worker,
      services: servicesByWorker[worker.worker_id] || [],
    }));

    // Filter by categoryId if specified
    if (options?.categoryId && options.categoryId.trim()) {
      const filtered = enrichedWorkers.filter((w) =>
        w.services?.some((s) => s.category_id === options.categoryId)
      );
      return { data: filtered, error: null };
    }

    return {
      data: enrichedWorkers,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Discovery] Unexpected error:', err);
    }
    return {
      data: [],
      error: new Error(sanitizeDiscoveryError(err)),
    };
  }
};

/**
 * Fetches services offered by a specific worker.
 */
export const getWorkerServicesForWorker = async (
  workerId: string
): Promise<{ data: WorkerService[]; error: Error | null }> => {
  if (!workerId) {
    return { data: [], error: new Error('Worker ID is required.') };
  }

  try {
    const { data, error } = await supabase
      .from('worker_services')
      .select(`
        id,
        worker_id,
        category_id,
        service_description,
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
        )
      `)
      .eq('worker_id', workerId);

    if (error) {
      return { data: [], error: new Error(sanitizeDiscoveryError(error)) };
    }

    const services: WorkerService[] = (data || []).map((item: any) => ({
      id: item.id,
      worker_id: item.worker_id,
      category_id: item.category_id,
      service_description: item.service_description,
      created_at: item.created_at,
      updated_at: item.updated_at,
      category: Array.isArray(item.category) ? item.category[0] : item.category || undefined,
    }));

    return { data: services, error: null };
  } catch (err: any) {
    return { data: [], error: new Error(sanitizeDiscoveryError(err)) };
  }
};

/**
 * Fetches verified workers who offer a specific service category.
 */
export const getWorkersByCategory = async (
  categoryId: string
): Promise<{ data: WorkerDiscoveryProfile[]; error: Error | null }> => {
  return getVerifiedWorkers({ categoryId });
};

/**
 * Retrieves a single verified worker profile by ID from public.worker_discovery,
 * along with their offered service categories.
 * Returns null if the worker does not exist or is not verified.
 */
export const getVerifiedWorkerById = async (
  workerId: string
): Promise<{ data: WorkerDiscoveryProfile | null; error: Error | null }> => {
  if (!workerId || !workerId.trim()) {
    return { data: null, error: new Error('Worker ID is required.') };
  }

  try {
    const { data: workerData, error: workerError } = await supabase
      .from('worker_discovery')
      .select(`
        worker_id,
        username,
        full_name,
        avatar_url,
        bio,
        experience_years,
        service_area,
        availability_status,
        verification_status,
        verified_at
      `)
      .eq('worker_id', workerId.trim())
      .maybeSingle();

    if (workerError) {
      if (__DEV__) {
        console.warn('[FixMo Discovery] Fetch single worker error:', workerError.message);
      }
      return { data: null, error: new Error(sanitizeDiscoveryError(workerError)) };
    }

    if (!workerData) {
      return { data: null, error: null };
    }

    // Fetch services offered by this verified worker
    const { data: servicesData } = await getWorkerServicesForWorker(workerId.trim());

    const worker: WorkerDiscoveryProfile = {
      ...(workerData as WorkerDiscoveryProfile),
      services: servicesData || [],
    };

    return { data: worker, error: null };
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn('[FixMo Discovery] Unexpected error in getVerifiedWorkerById:', err);
    }
    const message = err instanceof Error ? err.message : 'Failed to retrieve worker profile.';
    return { data: null, error: new Error(message) };
  }
};

/**
 * Batch retrieves verified worker discovery profiles for a list of worker IDs.
 * Returns a map of worker_id -> WorkerDiscoveryProfile.
 */
export const getWorkersByIds = async (
  workerIds: string[]
): Promise<Record<string, WorkerDiscoveryProfile>> => {
  const uniqueIds = Array.from(new Set(workerIds.filter((id) => Boolean(id && id.trim()))));
  if (uniqueIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('worker_discovery')
      .select(`
        worker_id,
        username,
        full_name,
        avatar_url,
        bio,
        experience_years,
        service_area,
        availability_status,
        verification_status,
        verified_at
      `)
      .in('worker_id', uniqueIds);

    if (error || !data) return {};

    const map: Record<string, WorkerDiscoveryProfile> = {};
    for (const item of data) {
      map[item.worker_id] = item as WorkerDiscoveryProfile;
    }
    return map;
  } catch {
    return {};
  }
};

/**
 * Client-side search and category filtering utility.
 * Performs fast, responsive, case-insensitive filtering over loaded workers.
 */
export const filterVerifiedWorkers = (
  workers: WorkerDiscoveryProfile[],
  filter: {
    searchQuery?: string;
    categoryId?: string | null;
  }
): WorkerDiscoveryProfile[] => {
  let result = workers;

  // Filter by category
  if (filter.categoryId && filter.categoryId !== 'All') {
    result = result.filter((w) =>
      w.services?.some((s) => s.category_id === filter.categoryId)
    );
  }

  // Filter by search query (Full name, Username, Bio, Service Area)
  if (filter.searchQuery && filter.searchQuery.trim()) {
    const q = filter.searchQuery.trim().toLowerCase();
    result = result.filter((w) => {
      const fullName = (w.full_name || '').toLowerCase();
      const username = (w.username || '').toLowerCase();
      const bio = (w.bio || '').toLowerCase();
      const serviceArea = (w.service_area || '').toLowerCase();
      const tradeNames = (w.services || [])
        .map((s) => (s.category?.name || '').toLowerCase())
        .join(' ');

      return (
        fullName.includes(q) ||
        username.includes(q) ||
        bio.includes(q) ||
        serviceArea.includes(q) ||
        tradeNames.includes(q)
      );
    });
  }

  return result;
};

/**
 * Sanitizes technical database errors into user-friendly messages.
 */
function sanitizeDiscoveryError(error: any): string {
  if (!error) return 'An unexpected error occurred while discovering workers.';

  const message = (error.message || '').toLowerCase();

  if (message.includes('permission denied') || message.includes('row-level security')) {
    return 'Permission denied. Unable to view worker directory at this time.';
  }

  return 'Unable to load verified workers. Please check your connection and try again.';
}
