'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Users, Calendar, Percent, Search, Filter } from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string;
  is_used: boolean;
  is_active: boolean;
  user_id: string | null;
  max_uses: number;
  current_uses: number;
  minimum_amount: number | null;
  maximum_discount: number | null;
  description: string | null;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
}

interface VoucherFormData {
  code: string;
  discount_percent: number;
  valid_until: string;
  user_id: string;
  max_uses: number;
  minimum_amount: number;
  maximum_discount: number;
  description: string;
  is_active: boolean;
}

export default function AdminVoucherManager() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState<VoucherFormData>({
    code: '',
    discount_percent: 10,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    user_id: '',
    max_uses: 1,
    minimum_amount: 0,
    maximum_discount: 0,
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vouchers');
      const data = await response.json();
      
      if (response.ok) {
        setVouchers(data.vouchers || []);
      } else {
        setMessage(data.error || 'Failed to fetch vouchers');
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setMessage('Failed to fetch vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const url = editingVoucher ? `/api/admin/vouchers/${editingVoucher.id}` : '/api/admin/vouchers';
      const method = editingVoucher ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minimum_amount: formData.minimum_amount || null,
          maximum_discount: formData.maximum_discount || null,
          user_id: formData.user_id || null
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(editingVoucher ? 'Voucher updated successfully' : 'Voucher created successfully');
        resetForm();
        fetchVouchers();
      } else {
        setMessage(result.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
      setMessage('Failed to save voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (voucherId: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('Voucher deleted successfully');
        fetchVouchers();
      } else {
        setMessage(result.error || 'Failed to delete voucher');
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      setMessage('Failed to delete voucher');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percent: 10,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      user_id: '',
      max_uses: 1,
      minimum_amount: 0,
      maximum_discount: 0,
      description: '',
      is_active: true
    });
    setShowCreateForm(false);
    setEditingVoucher(null);
  };

  const startEdit = (voucher: Voucher) => {
    setFormData({
      code: voucher.code,
      discount_percent: voucher.discount_percent,
      valid_until: voucher.valid_until.split('T')[0],
      user_id: voucher.user_id || '',
      max_uses: voucher.max_uses,
      minimum_amount: voucher.minimum_amount || 0,
      maximum_discount: voucher.maximum_discount || 0,
      description: voucher.description || '',
      is_active: voucher.is_active
    });
    setEditingVoucher(voucher);
    setShowCreateForm(true);
  };

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const getVoucherStatus = (voucher: Voucher) => {
    if (!voucher.is_active) return 'inactive';
    if (voucher.current_uses >= voucher.max_uses) return 'used';
    if (new Date(voucher.valid_until) < new Date()) return 'expired';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'used': return 'text-gray-600 bg-gray-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const status = getVoucherStatus(voucher);
    if (filterStatus === 'all') return true;
    return status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voucher Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage discount vouchers</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Voucher
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voucher Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={generateVoucherCode}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Percentage
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.discount_percent}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Uses
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => setFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minimum_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_amount: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.maximum_discount}
                onChange={(e) => setFormData(prev => ({ ...prev, maximum_discount: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Internal description for this voucher..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active (voucher can be used)
                </span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingVoucher ? 'Update Voucher' : 'Create Voucher')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vouchers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vouchers ({filteredVouchers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading vouchers...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No vouchers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVouchers.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  return (
                    <tr key={voucher.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {voucher.code}
                          </div>
                          {voucher.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {voucher.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Percent className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {voucher.discount_percent}%
                          </span>
                        </div>
                        {voucher.maximum_discount && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Max: ₹{voucher.maximum_discount.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-blue-500 mr-1" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {voucher.current_uses}/{voucher.max_uses}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(voucher.valid_until).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(voucher)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(voucher.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
          {message}
          <button
            onClick={() => setMessage('')}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
