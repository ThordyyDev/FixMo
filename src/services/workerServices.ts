import { supabase } from './supabase';
import { WorkerService } from '@/types';

/**
 * Retrieves all service categories offered by a specific worker,
 * joined with service_category metadata.
 */
export const getWorkerServices = async (
  workerId: string
): Promise<{ data: WorkerService[]; error: Error | null }> => {
  if (!workerId) {
    return {
      data: [],
      error: new Error('Worker ID is required to fetch services.'),
    };
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
      .eq('worker_id', workerId)
      .order('created_at', { ascending: true });

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Worker Services] Fetch error:', error.message);
      }
      return {
        data: [],
        error: new Error(sanitizeWorkerServiceError(error)),
      };
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

    return {
      data: services,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Worker Services] Unexpected fetch error:', err);
    }
    return {
      data: [],
      error: new Error(sanitizeWorkerServiceError(err)),
    };
  }
};

/**
 * Adds a new service category offering for the authenticated worker.
 * Prevents duplicates via Supabase table constraints.
 */
export const addWorkerService = async (
  workerId: string,
  categoryId: string,
  serviceDescription?: string | null
): Promise<{ data: WorkerService | null; error: Error | null }> => {
  if (!workerId) {
    return {
      data: null,
      error: new Error('Authentication required. Please sign in again.'),
    };
  }

  if (!categoryId) {
    return {
      data: null,
      error: new Error('Please select a service category.'),
    };
  }

  const sanitizedDescription = serviceDescription?.trim() || null;

  try {
    const { data, error } = await supabase
      .from('worker_services')
      .insert({
        worker_id: workerId,
        category_id: categoryId,
        service_description: sanitizedDescription,
      })
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
      .single();

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Worker Services] Insert error:', error.message);
      }
      return {
        data: null,
        error: new Error(sanitizeWorkerServiceError(error)),
      };
    }

    const service: WorkerService = {
      id: data.id,
      worker_id: data.worker_id,
      category_id: data.category_id,
      service_description: data.service_description,
      created_at: data.created_at,
      updated_at: data.updated_at,
      category: Array.isArray(data.category) ? data.category[0] : data.category || undefined,
    };

    return {
      data: service,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Worker Services] Unexpected insert error:', err);
    }
    return {
      data: null,
      error: new Error(sanitizeWorkerServiceError(err)),
    };
  }
};

/**
 * Updates the custom service description for an existing worker service.
 * The category itself cannot be changed.
 */
export const updateWorkerService = async (
  workerId: string,
  serviceId: string,
  serviceDescription?: string | null
): Promise<{ data: WorkerService | null; error: Error | null }> => {
  if (!workerId || !serviceId) {
    return {
      data: null,
      error: new Error('Worker ID and Service ID are required.'),
    };
  }

  const sanitizedDescription = serviceDescription?.trim() || null;

  try {
    const { data, error } = await supabase
      .from('worker_services')
      .update({
        service_description: sanitizedDescription,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId)
      .eq('worker_id', workerId)
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
      .single();

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Worker Services] Update error:', error.message);
      }
      return {
        data: null,
        error: new Error(sanitizeWorkerServiceError(error)),
      };
    }

    const service: WorkerService = {
      id: data.id,
      worker_id: data.worker_id,
      category_id: data.category_id,
      service_description: data.service_description,
      created_at: data.created_at,
      updated_at: data.updated_at,
      category: Array.isArray(data.category) ? data.category[0] : data.category || undefined,
    };

    return {
      data: service,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Worker Services] Unexpected update error:', err);
    }
    return {
      data: null,
      error: new Error(sanitizeWorkerServiceError(err)),
    };
  }
};

/**
 * Deletes a worker service offering.
 * Scoped strictly to the authenticated worker.
 */
export const deleteWorkerService = async (
  workerId: string,
  serviceId: string
): Promise<{ success: boolean; error: Error | null }> => {
  if (!workerId || !serviceId) {
    return {
      success: false,
      error: new Error('Worker ID and Service ID are required.'),
    };
  }

  try {
    const { error } = await supabase
      .from('worker_services')
      .delete()
      .eq('id', serviceId)
      .eq('worker_id', workerId);

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Worker Services] Delete error:', error.message);
      }
      return {
        success: false,
        error: new Error(sanitizeWorkerServiceError(error)),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Worker Services] Unexpected delete error:', err);
    }
    return {
      success: false,
      error: new Error(sanitizeWorkerServiceError(err)),
    };
  }
};

/**
 * Sanitizes technical PostgreSQL/PostgREST error codes and messages into user-friendly feedback.
 */
function sanitizeWorkerServiceError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = (error.message || '').toLowerCase();

  // PostgreSQL unique constraint violation (duplicate category for worker)
  if (
    code === '23505' ||
    message.includes('unique constraint') ||
    message.includes('duplicate key') ||
    message.includes('worker_services_worker_id_category_id_key')
  ) {
    return 'You already added this service.';
  }

  // Row Level Security / permission denied
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Permission denied. You can only manage your own worker services.';
  }

  // Foreign key violation
  if (code === '23503' || message.includes('foreign key')) {
    return 'Selected category is not recognized. Please choose from available categories.';
  }

  return 'Unable to save service changes. Please check your connection and try again.';
}
