import { supabase } from './supabase';
import { ServiceCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';

/**
 * Retrieves all active service categories from public.service_categories,
 * ordered alphabetically by name.
 */
export const getServiceCategories = async (): Promise<{
  data: ServiceCategory[];
  error: Error | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('id, name, description, icon, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Categories] Supabase fetch error:', error.message);
      }
      return {
        data: [],
        error: new Error('Unable to load service categories. Please check your connection and try again.'),
      };
    }

    return {
      data: (data as ServiceCategory[]) || [],
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Categories] Unexpected error:', err);
    }
    return {
      data: [],
      error: new Error(err?.message || 'Failed to load service categories.'),
    };
  }
};

/**
 * Maps category icon string or category name to an Ionicons glyph name.
 * Provides resilient fallbacks for missing or custom icon names.
 */
export const getCategoryIconName = (
  iconString?: string | null,
  categoryName?: string
): keyof typeof Ionicons.glyphMap => {
  const icon = (iconString || '').toLowerCase().trim();
  const name = (categoryName || '').toLowerCase().trim();

  // Explicit mappings based on database icon values and names
  if (icon === 'plumbing' || icon === 'water' || name.includes('plumb')) {
    return 'water-outline';
  }
  if (icon === 'electrical' || icon === 'flash' || name.includes('electr')) {
    return 'flash-outline';
  }
  if (icon === 'carpentry' || icon === 'hammer' || name.includes('carpent')) {
    return 'hammer-outline';
  }
  if (icon === 'appliance' || icon === 'tv' || name.includes('appliance')) {
    return 'construct-outline';
  }

  // Check if icon string directly matches an Ionicons glyph
  if (icon && icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap;
  }

  return 'build-outline';
};
