import { useState, useEffect } from 'react';

interface DynamicSlot {
  id: string;
  date: string;
  capacity: number;
  booked: number;
  available: number;
  status: string;
}

interface DynamicSlotsResponse {
  slots: DynamicSlot[];
  allSlots: DynamicSlot[];
  totalSlots: number;
  availableSlots: number;
}

export function useDynamicSlots(trekSlug: string) {
  const [slots, setSlots] = useState<DynamicSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trekSlug) {
      setLoading(false);
      return;
    }

    const fetchDynamicSlots = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/slots?trek_slug=${encodeURIComponent(trekSlug)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch slots: ${response.status}`);
        }

        const data: DynamicSlotsResponse = await response.json();
        
        // Use allSlots to get both available and unavailable slots for display
        setSlots(data.allSlots || data.slots || []);
      } catch (err) {
        console.error('Error fetching dynamic slots:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicSlots();
  }, [trekSlug]);

  return {
    slots,
    loading,
    error,
    availableSlots: slots.filter(slot => slot.available > 0),
    totalAvailable: slots.reduce((sum, slot) => sum + slot.available, 0)
  };
}

// Hook for multiple treks (for trek listing page)
export function useDynamicSlotsForTreks(trekSlugs: string[]) {
  const [slotsData, setSlotsData] = useState<Record<string, DynamicSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trekSlugs.length) {
      setLoading(false);
      return;
    }

    const fetchAllSlots = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch slots for all treks in parallel
        const promises = trekSlugs.map(async (slug) => {
          try {
            const response = await fetch(`/api/slots?trek_slug=${encodeURIComponent(slug)}`);
            if (!response.ok) {
              console.warn(`Failed to fetch slots for ${slug}: ${response.status}`);
              return { slug, slots: [] };
            }
            const data: DynamicSlotsResponse = await response.json();
            return { slug, slots: data.allSlots || data.slots || [] };
          } catch (err) {
            console.warn(`Error fetching slots for ${slug}:`, err);
            return { slug, slots: [] };
          }
        });

        const results = await Promise.all(promises);
        
        const newSlotsData: Record<string, DynamicSlot[]> = {};
        results.forEach(({ slug, slots }) => {
          newSlotsData[slug] = slots;
        });

        setSlotsData(newSlotsData);
      } catch (err) {
        console.error('Error fetching dynamic slots for multiple treks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch slots');
      } finally {
        setLoading(false);
      }
    };

    fetchAllSlots();
  }, [trekSlugs.join(',')]); // Re-run when trek slugs change

  return {
    slotsData,
    loading,
    error,
    getSlotsForTrek: (slug: string) => slotsData[slug] || [],
    getAvailableSlotsForTrek: (slug: string) => {
      const slots = slotsData[slug] || [];
      return slots.filter(slot => slot.available > 0);
    },
    getTotalAvailableForTrek: (slug: string) => {
      const slots = slotsData[slug] || [];
      return slots.reduce((sum, slot) => sum + slot.available, 0);
    }
  };
}
