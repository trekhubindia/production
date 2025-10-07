import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// TypeScript interfaces for the tables
interface Booking {
  id: string;
  user_id: string;
  trek_slug: string;
  trek_name?: string;
  slot_id?: string;
  booking_date: string;
  trek_date?: string;
  participants: number;
  total_amount: number;
  base_amount?: number;
  gst_amount?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_dob?: string;
  customer_age?: number;
  customer_gender?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  recent_illnesses?: string;
  current_medications?: string;
  trekking_experience?: string;
  fitness_consent?: boolean;
  residential_address?: string;
  needs_transportation?: boolean;
  pickup_point?: string;
  accommodation_preferences?: string;
  terms_accepted?: boolean;
  liability_waiver_accepted?: boolean;
  covid_declaration_accepted?: boolean;
  trek_gear_rental?: boolean;
  porter_services?: boolean;
  addon_details?: Record<string, unknown>;
  special_requirements?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_intent_id?: string;
  payment_amount?: number;
  payment_type?: 'full' | 'advance';
  advance_amount?: number;
  remaining_amount?: number;
  pickup_location?: string;
  voucher_code?: string;
  voucher_discount?: number;
  created_at: string;
  updated_at: string;
}

interface TrekSlot {
  id: string;
  trek_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  status: 'open' | 'full' | 'closed';
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  // Add other auth user fields as needed
}

// Event types for real-time updates
type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

// Callback types for real-time updates
type BookingUpdateCallback = (booking: Booking, event: RealtimeEventType) => void;
type TrekSlotUpdateCallback = (slot: TrekSlot, event: RealtimeEventType) => void;
type UserProfileUpdateCallback = (profile: UserProfile, event: RealtimeEventType) => void;
type AuthUserUpdateCallback = (user: AuthUser, event: RealtimeEventType) => void;

interface UseRealtimeDataProps {
  // Optional callbacks for each table
  onBookingUpdate?: BookingUpdateCallback;
  onTrekSlotUpdate?: TrekSlotUpdateCallback;
  onUserProfileUpdate?: UserProfileUpdateCallback;
  onAuthUserUpdate?: AuthUserUpdateCallback;
  
  // Optional filters
  userId?: string;
  trekId?: string;
  
  // Enable/disable specific subscriptions
  enableBookings?: boolean;
  enableTrekSlots?: boolean;
  enableUserProfiles?: boolean;
  enableAuthUsers?: boolean;
  
  // Admin mode - allows seeing all data without user filtering
  isAdmin?: boolean;
}

interface RealtimeStatus {
  bookings: boolean;
  trekSlots: boolean;
  userProfiles: boolean;
  authUsers: boolean;
}

export function useRealtimeData({
  onBookingUpdate,
  onTrekSlotUpdate,
  onUserProfileUpdate,
  onAuthUserUpdate,
  userId,
  trekId,
  enableBookings = true,
  enableTrekSlots = true,
  enableUserProfiles = true,
  enableAuthUsers = true,
  isAdmin = false,
}: UseRealtimeDataProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeStatus>({
    bookings: false,
    trekSlots: false,
    userProfiles: false,
    authUsers: false,
  });
  const [error, setError] = useState<string | null>(null);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  const connect = useCallback(async () => {
    try {
      setError(null);
      console.log('[RT] Setting up real-time subscriptions...');

      // Clean up existing channels
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();

      // Subscribe to bookings
      if (enableBookings) {
        const bookingsChannel = supabase
          .channel('bookings_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookings',
              filter: isAdmin ? undefined : (userId ? `user_id=eq.${userId}` : undefined),
            },
            (payload: RealtimePostgresChangesPayload<Booking>) => {
              console.log('[RT] Booking update:', payload);
              if (payload.new && onBookingUpdate) {
                onBookingUpdate(payload.new as Booking, payload.eventType as RealtimeEventType);
              }
            }
          )
          .subscribe((status) => {
            console.log('[RT] Bookings subscription status:', status);
            setConnectionStatus(prev => ({ ...prev, bookings: status === 'SUBSCRIBED' }));
          });

        channelsRef.current.set('bookings', bookingsChannel);
      }

      // Subscribe to trek_slots
      if (enableTrekSlots) {
        const trekSlotsChannel = supabase
          .channel('trek_slots_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'trek_slots',
              filter: trekId ? `trek_id=eq.${trekId}` : undefined,
            },
            (payload: RealtimePostgresChangesPayload<TrekSlot>) => {
              console.log('[RT] Trek slot update:', payload);
              if (payload.new && onTrekSlotUpdate) {
                onTrekSlotUpdate(payload.new as TrekSlot, payload.eventType as RealtimeEventType);
              }
            }
          )
          .subscribe((status) => {
            console.log('[RT] Trek slots subscription status:', status);
            setConnectionStatus(prev => ({ ...prev, trekSlots: status === 'SUBSCRIBED' }));
          });

        channelsRef.current.set('trek_slots', trekSlotsChannel);
      }

      // Subscribe to user_profiles
      if (enableUserProfiles) {
        const userProfilesChannel = supabase
          .channel('user_profiles_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_profiles',
              filter: userId ? `user_id=eq.${userId}` : undefined,
            },
            (payload: RealtimePostgresChangesPayload<UserProfile>) => {
              console.log('[RT] User profile update:', payload);
              if (payload.new && onUserProfileUpdate) {
                onUserProfileUpdate(payload.new as UserProfile, payload.eventType as RealtimeEventType);
              }
            }
          )
          .subscribe((status) => {
            console.log('[RT] User profiles subscription status:', status);
            setConnectionStatus(prev => ({ ...prev, userProfiles: status === 'SUBSCRIBED' }));
          });

        channelsRef.current.set('user_profiles', userProfilesChannel);
      }

      // Subscribe to auth.users (if accessible)
      if (enableAuthUsers) {
        const authUsersChannel = supabase
          .channel('auth_users_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'auth',
              table: 'users',
              filter: userId ? `id=eq.${userId}` : undefined,
            },
            (payload: RealtimePostgresChangesPayload<AuthUser>) => {
              console.log('[RT] Auth user update:', payload);
              if (payload.new && onAuthUserUpdate) {
                onAuthUserUpdate(payload.new as AuthUser, payload.eventType as RealtimeEventType);
              }
            }
          )
          .subscribe((status) => {
            console.log('[RT] Auth users subscription status:', status);
            setConnectionStatus(prev => ({ ...prev, authUsers: status === 'SUBSCRIBED' }));
          });

        channelsRef.current.set('auth_users', authUsersChannel);
      }

      setIsConnected(true);
      console.log('[RT] Real-time subscriptions setup complete');
    } catch (err) {
      console.error('[RT] Error setting up real-time subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to real-time updates');
      setIsConnected(false);
    }
  }, [
    onBookingUpdate,
    onTrekSlotUpdate,
    onUserProfileUpdate,
    onAuthUserUpdate,
    userId,
    trekId,
    enableBookings,
    enableTrekSlots,
    enableUserProfiles,
    enableAuthUsers,
    isAdmin,
  ]);

  const disconnect = useCallback(() => {
    console.log('[RT] Disconnecting from real-time subscriptions...');
    
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
    
    setIsConnected(false);
    setConnectionStatus({
      bookings: false,
      trekSlots: false,
      userProfiles: false,
      authUsers: false,
    });
    
    console.log('[RT] Disconnected from real-time subscriptions');
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
  };
} 