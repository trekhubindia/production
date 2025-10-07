'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Gift,
  Percent,
  Copy,
  Plus,
  X,
  Check,
  UserCheck,
  User,
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Voucher {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string;
  is_used: boolean;
  created_at: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  used_at?: string;
  used_by?: string;
  minimum_amount?: number;
  maximum_discount?: number;
  description?: string;
  is_active?: boolean;
  max_uses?: number;
  current_uses?: number;
}

interface AdminVouchersClientProps {
  vouchers: Voucher[];
}

export default function AdminVouchersClient({ vouchers }: AdminVouchersClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [creatingVoucher, setCreatingVoucher] = useState(false);
  const [updatingVoucher, setUpdatingVoucher] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    code: '',
    discount_percent: '',
    valid_until: '',
    user_id: '',
    description: '',
    minimum_amount: '',
    maximum_discount: '',
    max_uses: '1',
    is_active: true
  });
  const [editForm, setEditForm] = useState({
    code: '',
    discount_percent: '',
    valid_until: '',
    user_id: '',
    description: '',
    minimum_amount: '',
    maximum_discount: '',
    max_uses: '',
    is_active: true
  });

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = 
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.user_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'used' && voucher.is_used) ||
      (statusFilter === 'unused' && !voucher.is_used);
    
    const matchesUser = userFilter === 'all' || voucher.user_id === userFilter;
    
    return matchesSearch && matchesStatus && matchesUser;
  });

  const stats = {
    total: vouchers.length,
    used: vouchers.filter(v => v.is_used).length,
    unused: vouchers.filter(v => !v.is_used).length,
    expired: vouchers.filter(v => new Date(v.valid_until) < new Date()).length,
    active: vouchers.filter(v => new Date(v.valid_until) >= new Date() && !v.is_used).length
  };

  const getStatusColor = (voucher: Voucher) => {
    if (voucher.is_used) {
      return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
    if (new Date(voucher.valid_until) < new Date()) {
      return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    }
    return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
  };

  const getStatusIcon = (voucher: Voucher) => {
    if (voucher.is_used) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (new Date(voucher.valid_until) < new Date()) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Gift className="w-4 h-4" />;
  };

  const getStatusText = (voucher: Voucher) => {
    if (voucher.is_used) return 'Used';
    if (new Date(voucher.valid_until) < new Date()) return 'Expired';
    return 'Active';
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      setMessage({ type: 'success', text: 'Voucher code copied to clipboard!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to copy voucher code' });
    }
  };

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const validateForm = (form: typeof createForm) => {
    if (!form.code.trim()) return 'Voucher code is required';
    if (!form.discount_percent || parseInt(form.discount_percent) < 1 || parseInt(form.discount_percent) > 100) {
      return 'Discount percent must be between 1 and 100';
    }
    if (!form.valid_until) return 'Valid until date is required';
    if (new Date(form.valid_until) <= new Date()) return 'Valid until date must be in the future';
    if (form.minimum_amount && parseInt(form.minimum_amount) < 0) return 'Minimum amount cannot be negative';
    if (form.maximum_discount && parseInt(form.maximum_discount) < 0) return 'Maximum discount cannot be negative';
    if (!form.max_uses || parseInt(form.max_uses) < 1) return 'Max uses must be at least 1';
    return null;
  };

  const createVoucher = async () => {
    const validationError = validateForm(createForm);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setCreatingVoucher(true);
    try {
      const response = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: createForm.code.toUpperCase().trim(),
          discount_percent: parseInt(createForm.discount_percent),
          valid_until: createForm.valid_until,
          user_id: createForm.user_id.trim() || null,
          description: createForm.description.trim() || null,
          minimum_amount: createForm.minimum_amount ? parseFloat(createForm.minimum_amount) : null,
          maximum_discount: createForm.maximum_discount ? parseFloat(createForm.maximum_discount) : null,
          max_uses: parseInt(createForm.max_uses),
          is_active: createForm.is_active
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Voucher created successfully!' });
        setShowCreateModal(false);
        setCreateForm({
          code: '',
          discount_percent: '',
          valid_until: '',
          user_id: '',
          description: '',
          minimum_amount: '',
          maximum_discount: '',
          max_uses: '1',
          is_active: true
        });
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to create voucher' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create voucher' });
    } finally {
      setCreatingVoucher(false);
    }
  };

  const openEditModal = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setEditForm({
      code: voucher.code,
      discount_percent: voucher.discount_percent.toString(),
      valid_until: voucher.valid_until.split('T')[0], // Format for date input
      user_id: voucher.user_id || '',
      description: voucher.description || '',
      minimum_amount: voucher.minimum_amount?.toString() || '',
      maximum_discount: voucher.maximum_discount?.toString() || '',
      max_uses: voucher.max_uses?.toString() || '1',
      is_active: voucher.is_active ?? true
    });
    setShowEditModal(true);
  };

  const updateVoucher = async () => {
    if (!selectedVoucher) return;
    
    const validationError = validateForm(editForm);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setUpdatingVoucher(true);
    try {
      const response = await fetch(`/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: editForm.code.toUpperCase().trim(),
          discount_percent: parseInt(editForm.discount_percent),
          valid_until: editForm.valid_until,
          user_id: editForm.user_id.trim() || null,
          description: editForm.description.trim() || null,
          minimum_amount: editForm.minimum_amount ? parseFloat(editForm.minimum_amount) : null,
          maximum_discount: editForm.maximum_discount ? parseFloat(editForm.maximum_discount) : null,
          max_uses: parseInt(editForm.max_uses),
          is_active: editForm.is_active
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Voucher updated successfully!' });
        setShowEditModal(false);
        setSelectedVoucher(null);
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update voucher' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update voucher' });
    } finally {
      setUpdatingVoucher(false);
    }
  };

  const deleteVoucher = async (voucherId: string, voucherCode: string) => {
    if (!confirm(`Are you sure you want to delete voucher "${voucherCode}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Voucher deleted successfully!' });
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete voucher' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete voucher' });
    }
  };

  const toggleVoucherStatus = async (voucherId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Voucher ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update voucher status' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update voucher status' });
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                Voucher Management
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Create and manage discount vouchers</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Voucher
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Active</p>
                    <p className="text-3xl font-bold text-foreground">{stats.active}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Used</p>
                    <p className="text-3xl font-bold text-foreground">{stats.used}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/20 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Unused</p>
                    <p className="text-3xl font-bold text-foreground">{stats.unused}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Expired</p>
                    <p className="text-3xl font-bold text-foreground">{stats.expired}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Display */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-xl border ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {message.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search vouchers by code, user name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="unused">Unused</option>
                <option value="expired">Expired</option>
              </select>
              <div className="flex bg-muted rounded-xl p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'cards' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'table' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Vouchers Display */}
          {filteredVouchers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No vouchers found</h3>
              <p className="text-muted-foreground text-lg">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No vouchers available'
                }
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid gap-6">
              <AnimatePresence>
                {filteredVouchers.map((voucher, index) => (
                  <motion.div
                    key={voucher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    layout
                  >
                    <Card className="hover:shadow-md transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {voucher.code}
                                  </h3>
                                  <button
                                    onClick={() => copyToClipboard(voucher.code)}
                                    className="p-1 text-muted-foreground hover:text-primary transition-colors rounded"
                                    title="Copy code"
                                  >
                                    {copiedCode === voucher.code ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Percent className="w-4 h-4" />
                                    {voucher.discount_percent}% off
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Valid until: {new Date(voucher.valid_until).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {voucher.user_name || 'No user assigned'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${getStatusColor(voucher)}`}>
                                  {getStatusIcon(voucher)}
                                  {getStatusText(voucher)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Created: {new Date(voucher.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Table View */
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-6 py-4 text-left font-semibold text-foreground">Code</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground">Discount</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground">Valid Until</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground">User</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground">Status</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground">Created</th>
                        <th className="px-6 py-4 text-left font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVouchers.map((voucher) => (
                        <tr key={voucher.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              {voucher.code}
                              <button
                                onClick={() => copyToClipboard(voucher.code)}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors rounded"
                                title="Copy code"
                              >
                                {copiedCode === voucher.code ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {voucher.discount_percent}%
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(voucher.valid_until).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {voucher.user_name || 'No user assigned'}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${getStatusColor(voucher)}`}>
                              {getStatusIcon(voucher)}
                              {getStatusText(voucher)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(voucher.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openEditModal(voucher)}
                                className="p-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-muted"
                                title="Edit voucher"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => toggleVoucherStatus(voucher.id, Boolean(voucher.is_active))}
                                className={`p-2 transition-colors rounded-lg hover:bg-muted ${
                                  voucher.is_active 
                                    ? 'text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400' 
                                    : 'text-muted-foreground hover:text-green-600 dark:hover:text-green-400'
                                }`}
                                title={voucher.is_active ? 'Deactivate voucher' : 'Activate voucher'}
                              >
                                {voucher.is_active ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => deleteVoucher(voucher.id, voucher.code)}
                                className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-muted"
                                title="Delete voucher"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Create Voucher Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Create New Voucher</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Voucher Code *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={createForm.code}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
                            required
                            className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                            placeholder="e.g., SUMMER20"
                          />
                          <button
                            type="button"
                            onClick={() => setCreateForm(prev => ({ ...prev, code: generateVoucherCode() }))}
                            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-all duration-300"
                            title="Generate random code"
                          >
                            🎲
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Discount Percentage *
                        </label>
                        <input
                          type="number"
                          value={createForm.discount_percent}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, discount_percent: e.target.value }))}
                          required
                          min="1"
                          max="100"
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                          placeholder="20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        value={createForm.description}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        placeholder="Brief description of the voucher..."
                      />
                    </div>
                  </div>

                  {/* Validity & Usage */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Validity & Usage</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Valid Until *
                        </label>
                        <input
                          type="date"
                          value={createForm.valid_until}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, valid_until: e.target.value }))}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Max Uses *
                        </label>
                        <input
                          type="number"
                          value={createForm.max_uses}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, max_uses: e.target.value }))}
                          required
                          min="1"
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                          placeholder="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Restrictions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Restrictions</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Minimum Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={createForm.minimum_amount}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, minimum_amount: e.target.value }))}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Maximum Discount (₹)
                        </label>
                        <input
                          type="number"
                          value={createForm.maximum_discount}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, maximum_discount: e.target.value }))}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        User ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={createForm.user_id}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, user_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        placeholder="Leave empty for general voucher"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a specific user ID to make this voucher user-specific
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Status</h3>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={createForm.is_active}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                        Active (voucher can be used immediately)
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={createVoucher}
                    disabled={creatingVoucher}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-lg font-semibold transition-all duration-300"
                  >
                    {creatingVoucher ? 'Creating...' : 'Create Voucher'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Voucher Modal */}
      <AnimatePresence>
        {showEditModal && selectedVoucher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Edit Voucher</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Voucher Code *
                      </label>
                      <input
                        type="text"
                        value={editForm.code}
                        onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        placeholder="e.g., SUMMER20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Discount Percentage *
                      </label>
                      <input
                        type="number"
                        value={editForm.discount_percent}
                        onChange={(e) => setEditForm(prev => ({ ...prev, discount_percent: e.target.value }))}
                        required
                        min="1"
                        max="100"
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Valid Until *
                      </label>
                      <input
                        type="date"
                        value={editForm.valid_until}
                        onChange={(e) => setEditForm(prev => ({ ...prev, valid_until: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Max Uses *
                      </label>
                      <input
                        type="number"
                        value={editForm.max_uses}
                        onChange={(e) => setEditForm(prev => ({ ...prev, max_uses: e.target.value }))}
                        required
                        min="1"
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                      placeholder="Brief description of the voucher..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Minimum Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={editForm.minimum_amount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, minimum_amount: e.target.value }))}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Maximum Discount (₹)
                      </label>
                      <input
                        type="number"
                        value={editForm.maximum_discount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, maximum_discount: e.target.value }))}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        placeholder="No limit"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      User ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.user_id}
                      onChange={(e) => setEditForm(prev => ({ ...prev, user_id: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                      placeholder="Leave empty for general voucher"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a specific user ID to make this voucher user-specific
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_is_active"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary"
                    />
                    <label htmlFor="edit_is_active" className="text-sm font-medium text-foreground">
                      Active (voucher can be used)
                    </label>
                  </div>

                  {selectedVoucher.is_used && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">This voucher has been used</span>
                      </div>
                      {selectedVoucher.used_at && (
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                          Used on: {new Date(selectedVoucher.used_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={updateVoucher}
                    disabled={updatingVoucher}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-lg font-semibold transition-all duration-300"
                  >
                    {updatingVoucher ? 'Updating...' : 'Update Voucher'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 