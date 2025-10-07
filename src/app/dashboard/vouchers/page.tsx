'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Gift, 
  Copy, 
  Check,
  Calendar,
  Percent,
  Tag,
  Search,
  Filter,
  Plus,
  Clock,
  Loader2
} from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string;
  is_used: boolean;
  user_id: string | null;
  created_at: string;
  used_at?: string;
  used_by?: string;
  minimum_amount?: number;
  maximum_discount?: number;
  description?: string;
}

export default function VouchersPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user vouchers from API
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/vouchers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch vouchers');
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        if (data.success) {
          setVouchers(data.vouchers || []);
        } else {
          throw new Error(data.error || 'Failed to load vouchers');
        }
      } catch (err) {
        console.error('Error fetching vouchers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vouchers');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && !voucher.is_used && (!voucher.valid_until || new Date(voucher.valid_until) > new Date())) ||
                         (filter === 'used' && voucher.is_used) ||
                         (filter === 'expired' && !voucher.is_used && voucher.valid_until && new Date(voucher.valid_until) < new Date());
    
    const matchesSearch = (voucher.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (voucher.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getVoucherStatus = (voucher: Voucher) => {
    if (voucher.is_used) return 'used';
    if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) return 'expired';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20';
      case 'used':
        return 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 opacity-75';
      case 'expired':
        return 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 opacity-75';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const getCategoryIcon = (voucher: Voucher) => {
    // Determine category based on voucher properties
    if (voucher.user_id) return <Tag className="w-4 h-4" />; // Personal voucher
    if (voucher.discount_percent >= 25) return <Gift className="w-4 h-4" />; // High discount
    return <Percent className="w-4 h-4" />; // Default
  };

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => !v.is_used && (!v.valid_until || new Date(v.valid_until) > new Date())).length,
    used: vouchers.filter(v => v.is_used).length,
    expired: vouchers.filter(v => !v.is_used && v.valid_until && new Date(v.valid_until) < new Date()).length
  };

  return (
    <>
      <Head>
        <title>My Vouchers | Trek Hub India</title>
        <meta name="description" content="View and manage your discount vouchers" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Vouchers</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Save money on your next adventure with these discount codes
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.total}</p>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Total Vouchers</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Active</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.used}</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Used</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.expired}</p>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">Expired</p>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'active', 'used', 'expired'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className={filter === status ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading vouchers...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center border-red-200 dark:border-red-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Failed to Load Vouchers
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              Try Again
            </Button>
          </Card>
        )}

        {/* Vouchers Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((voucher) => {
                const status = getVoucherStatus(voucher);
                const discountDisplay = voucher.discount_percent && voucher.discount_percent > 0 
                  ? `${voucher.discount_percent}% OFF` 
                  : 'Free Voucher';
                const categoryType = voucher.user_id ? 'Personal' : 'General';
                
                return (
                  <Card key={voucher.id} className={`p-6 border-2 border-dashed ${getStatusColor(status)} transition-all hover:shadow-lg`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          {getCategoryIcon(voucher)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {discountDisplay}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Available Vouchers</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          status === 'used' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                      {voucher.description || (voucher.discount_percent && voucher.discount_percent > 0 
                        ? `Get ${voucher.discount_percent}% discount on your next trek booking!`
                        : 'Free voucher for your next trek booking!')}
                    </p>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Applicable on: All Trek Bookings
                      </p>
                      
                      {status === 'active' && (
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => copyToClipboard(voucher.code)}
                        >
                          {copiedCode === voucher.code ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Code & Use
                            </>
                          )}
                        </Button>
                      )}
                      
                      {status === 'expired' && (
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Expired</span>
                          </div>
                        </div>
                      )}
                      
                      {status === 'used' && (
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Already Used</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full">
                <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
                  <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No vouchers found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Check back later for discount codes and special offers</p>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
