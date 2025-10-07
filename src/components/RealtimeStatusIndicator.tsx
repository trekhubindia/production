'use client';

import React from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';

interface RealtimeStatusIndicatorProps {
  userId?: string;
  trekId?: string;
  className?: string;
  enableBookings?: boolean;
  enableTrekSlots?: boolean;
  enableUserProfiles?: boolean;
  enableAuthUsers?: boolean;
  isAdmin?: boolean;
}

export function RealtimeStatusIndicator({ 
  userId, 
  trekId, 
  className = '',
  enableBookings = true,
  enableTrekSlots = false,
  enableUserProfiles = false,
  enableAuthUsers = false,
  isAdmin = false,
}: RealtimeStatusIndicatorProps) {
  const { isConnected, connectionStatus, error } = useRealtimeData({
    userId,
    trekId,
    enableBookings,
    enableTrekSlots,
    enableUserProfiles,
    enableAuthUsers,
    isAdmin,
  });

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">Connection Error</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-sm font-medium">Connecting...</span>
      </div>
    );
  }

  const activeConnections = [
    { name: 'Bookings', status: connectionStatus.bookings },
    { name: 'Trek Slots', status: connectionStatus.trekSlots },
    { name: 'User Profiles', status: connectionStatus.userProfiles },
    { name: 'Auth Users', status: connectionStatus.authUsers },
  ].filter(conn => conn.status);

  return (
    <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium">
        Live Updates ({activeConnections.length} active)
      </span>
    </div>
  );
} 