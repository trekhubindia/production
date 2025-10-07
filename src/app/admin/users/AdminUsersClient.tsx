'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  Ban,
  Trash2,
  Activity,
  Clock,
  Key,
  Copy,
  X,
  UserCheck,
  UserX,
  Eye,
  BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  date_of_birth?: string;
  gender?: string;
  bio?: string;
  website?: string;
  role: string;
  is_active: boolean;
  is_activated: boolean;
  provider: string;
  created_at: string;
  updated_at: string;
  assigned_at?: string;
  assigned_by?: string;
  activated_at?: string;
  last_login?: string;
  last_activity?: string;
  session_count: number;

}

interface AdminUsersClientProps {
  users: User[];
  currentUserRole: string;
}

export default function AdminUsersClient({ users, currentUserRole }: AdminUsersClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<Record<string, unknown>[]>([]);

  const filteredUsers = users.filter(user => {
    const displayName = user.name !== 'No name' ? user.name : user.email.split('@')[0];
    const displayUsername = user.username !== 'No username' ? user.username : user.email.split('@')[0];
    
    const matchesSearch = 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active) ||
      (statusFilter === 'activated' && user.is_activated) ||
      (statusFilter === 'pending' && !user.is_activated);
    
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && new Date(user.created_at).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' && new Date(user.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && new Date(user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    activated: users.filter(u => u.is_activated).length,
    admins: users.filter(u => u.role === 'admin').length,
    owners: users.filter(u => u.role === 'owner').length,
    today: users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-600';
      case 'admin': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'moderator': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (user: User) => {
    if (!user.is_active) return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
    if (!user.is_activated) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
  };

  const getStatusText = (user: User) => {
    if (!user.is_active) return 'Banned';
    if (!user.is_activated) return 'Pending';
    return 'Active';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Copied to clipboard!' });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to copy' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const updateUserStatus = async (userId: string, action: 'ban' | 'unban' | 'delete' | 'disable' | 'enable') => {
    setUpdatingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `User ${action === 'ban' ? 'banned' : action === 'unban' ? 'unbanned' : action === 'disable' ? 'disabled' : action === 'enable' ? 'enabled' : 'deleted'} successfully!` 
        });
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update user' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setUpdatingUser(null);
    }
  };

  const resetPassword = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password reset link sent successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to send reset link' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setUpdatingUser(null);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'User role updated successfully!' });
        setShowRoleModal(false);
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update role' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setUpdatingUser(null);
    }
  };

  const fetchActivityLogs = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity`);
      if (response.ok) {
        const logs = await response.json();
        setActivityLogs(logs);
        setShowActivityLogs(true);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch activity logs' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred' });
    }
  };



  return (
    <div className="py-10 px-4 w-full flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Logged in as:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(currentUserRole)}`}>
              {currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Activated</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.activated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="w-5 h-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Banned</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total - stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.today}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by name, email, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Banned</option>
            <option value="activated">Activated</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors"
          >
            {viewMode === 'cards' ? <Users className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mb-4 p-3 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Users Grid/Table */}
      <AnimatePresence mode="wait">
        {viewMode === 'cards' ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {user.avatar_url ? (
                              <Image
                                src={user.avatar_url}
                                alt={user.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                              user.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground line-clamp-1">
                              {user.name !== 'No name' ? user.name : user.email.split('@')[0]}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              @{user.username !== 'No username' ? user.username : user.email.split('@')[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetail(true);
                            }}
                            className="p-1 hover:bg-accent rounded transition-colors"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground line-clamp-1">{user.email}</span>
                          <button
                            onClick={() => copyToClipboard(user.email)}
                            className="p-1 hover:bg-accent rounded transition-colors"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground font-mono text-xs">{user.id.slice(0, 8)}...</span>
                          <button
                            onClick={() => copyToClipboard(user.id)}
                            className="p-1 hover:bg-accent rounded transition-colors"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{user.phone}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground line-clamp-1">{user.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {user.last_login && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Last: {new Date(user.last_login).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user)}`}>
                          {getStatusText(user)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {user.is_active ? (
                          <button
                            onClick={() => updateUserStatus(user.id, 'ban')}
                            disabled={updatingUser === user.id}
                            className="px-3 py-2 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                            title="Ban user"
                          >
                            {updatingUser === user.id ? '...' : 'Ban'}
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserStatus(user.id, 'unban')}
                            disabled={updatingUser === user.id}
                            className="px-3 py-2 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                            title="Unban user"
                          >
                            {updatingUser === user.id ? '...' : 'Unban'}
                          </button>
                        )}
                        {currentUserRole === 'owner' && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            disabled={updatingUser === user.id}
                            className="px-3 py-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                            title="Change role"
                          >
                            Role
                          </button>
                        )}
                        <button
                          onClick={() => resetPassword(user.id)}
                          disabled={updatingUser === user.id}
                          className="px-3 py-2 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
                          title="Send password reset"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => fetchActivityLogs(user.id)}
                          disabled={updatingUser === user.id}
                          className="px-3 py-2 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                          title="View activity logs"
                        >
                          Logs
                        </button>
                        <button
                          onClick={() => updateUserStatus(user.id, 'delete')}
                          disabled={updatingUser === user.id}
                          className="px-3 py-2 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          title="Delete user"
                        >
                          {updatingUser === user.id ? '...' : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-x-auto rounded-lg border bg-card"
          >
        <table className="min-w-full text-sm">
          <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {user.avatar_url ? (
                              <Image
                                src={user.avatar_url}
                                alt={user.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                              user.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.name !== 'No name' ? user.name : user.email.split('@')[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{user.username !== 'No username' ? user.username : user.email.split('@')[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-foreground">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">{user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                  </span>
                </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user)}`}>
                          {getStatusText(user)}
                  </span>
                </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetail(true);
                            }}
                            className="p-1 hover:bg-accent rounded transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {user.is_active ? (
                            <button
                              onClick={() => updateUserStatus(user.id, 'ban')}
                              disabled={updatingUser === user.id}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                              title="Ban user"
                            >
                              <Ban className="w-4 h-4 text-red-500" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user.id, 'unban')}
                              disabled={updatingUser === user.id}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                              title="Unban user"
                            >
                              <UserCheck className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          {currentUserRole === 'owner' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleModal(true);
                              }}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Change role"
                            >
                              <Shield className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          <button
                            onClick={() => resetPassword(user.id)}
                            disabled={updatingUser === user.id}
                            className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded transition-colors disabled:opacity-50"
                            title="Send password reset"
                          >
                            <Key className="w-4 h-4 text-yellow-500" />
                          </button>
                          <button
                            onClick={() => fetchActivityLogs(user.id)}
                            disabled={updatingUser === user.id}
                            className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded transition-colors disabled:opacity-50"
                            title="View activity logs"
                          >
                            <Activity className="w-4 h-4 text-purple-500" />
                          </button>
                          <button
                            onClick={() => updateUserStatus(user.id, 'delete')}
                            disabled={updatingUser === user.id}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                </td>
              </tr>
                  ))
                ) : (
              <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
          </motion.div>
        )}
      </AnimatePresence>

             {/* User Detail Modal */}
       {showUserDetail && selectedUser && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-foreground">User Details</h2>
                 <button
                   onClick={() => setShowUserDetail(false)}
                   className="p-2 hover:bg-accent rounded transition-colors"
                 >
                   <X className="w-5 h-5 text-muted-foreground" />
                 </button>
               </div>
               
               <div className="space-y-6">
                 <div className="flex items-center space-x-4">
                   {selectedUser.avatar_url ? (
                     <Image
                       src={selectedUser.avatar_url}
                       alt={selectedUser.name}
                       width={64}
                       height={64}
                       className="w-16 h-16 rounded-full object-cover"
                     />
                   ) : (
                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                       <User className="w-8 h-8 text-white" />
                     </div>
                   )}
                   <div>
                     <h3 className="text-xl font-semibold text-foreground">
                       {selectedUser.name !== 'No name' ? selectedUser.name : selectedUser.email.split('@')[0]}
                     </h3>
                     <p className="text-muted-foreground">
                       @{selectedUser.username !== 'No username' ? selectedUser.username : selectedUser.email.split('@')[0]}
                     </p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Email</label>
                       <div className="flex items-center space-x-2 mt-1">
                         <span className="text-foreground">{selectedUser.email}</span>
                         <button
                           onClick={() => copyToClipboard(selectedUser.email)}
                           className="p-1 hover:bg-accent rounded transition-colors"
                         >
                           <Copy className="w-3 h-3 text-muted-foreground" />
                         </button>
                       </div>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">User ID</label>
                       <div className="flex items-center space-x-2 mt-1">
                         <span className="text-foreground font-mono text-sm">{selectedUser.id}</span>
                         <button
                           onClick={() => copyToClipboard(selectedUser.id)}
                           className="p-1 hover:bg-accent rounded transition-colors"
                         >
                           <Copy className="w-3 h-3 text-muted-foreground" />
                         </button>
                       </div>
                     </div>
                     {selectedUser.phone && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Phone</label>
                         <p className="text-foreground mt-1">{selectedUser.phone}</p>
                       </div>
                     )}
                     {selectedUser.location && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Location</label>
                         <p className="text-foreground mt-1">{selectedUser.location}</p>
                       </div>
                     )}
                     {selectedUser.date_of_birth && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                         <p className="text-foreground mt-1">{new Date(selectedUser.date_of_birth).toLocaleDateString()}</p>
                       </div>
                     )}
                     {selectedUser.gender && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Gender</label>
                         <p className="text-foreground mt-1">{selectedUser.gender}</p>
                       </div>
                     )}
                     {selectedUser.website && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Website</label>
                         <p className="text-foreground mt-1">{selectedUser.website}</p>
                       </div>
                     )}
                     {selectedUser.bio && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Bio</label>
                         <p className="text-foreground mt-1 text-sm">{selectedUser.bio}</p>
                       </div>
                     )}
                   </div>
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Role</label>
                       <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getRoleColor(selectedUser.role)}`}>
                         {selectedUser.role}
                       </span>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Status</label>
                       <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(selectedUser)}`}>
                         {getStatusText(selectedUser)}
                       </span>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Provider</label>
                       <p className="text-foreground mt-1">{selectedUser.provider}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Created</label>
                       <p className="text-foreground mt-1">{new Date(selectedUser.created_at).toLocaleString()}</p>
                     </div>
                     {selectedUser.activated_at && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Activated</label>
                         <p className="text-foreground mt-1">{new Date(selectedUser.activated_at).toLocaleString()}</p>
                       </div>
                     )}
                     {selectedUser.last_login && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                         <p className="text-foreground mt-1">{new Date(selectedUser.last_login).toLocaleString()}</p>
                       </div>
                     )}
                     {selectedUser.last_activity && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                         <p className="text-foreground mt-1">{new Date(selectedUser.last_activity).toLocaleString()}</p>
                       </div>
                     )}
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Sessions</label>
                       <p className="text-foreground mt-1">{selectedUser.session_count} active sessions</p>
                     </div>

                   </div>
                 </div>

                 <div className="flex flex-wrap gap-2 pt-4 border-t">
                   {selectedUser.is_active ? (
                     <button
                       onClick={() => updateUserStatus(selectedUser.id, 'ban')}
                       disabled={updatingUser === selectedUser.id}
                       className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                     >
                       {updatingUser === selectedUser.id ? 'Updating...' : 'Ban User'}
                     </button>
                   ) : (
                     <button
                       onClick={() => updateUserStatus(selectedUser.id, 'unban')}
                       disabled={updatingUser === selectedUser.id}
                       className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                     >
                       {updatingUser === selectedUser.id ? 'Updating...' : 'Unban User'}
                     </button>
                   )}
                   <button
                     onClick={() => {
                       setShowUserDetail(false);
                       setShowRoleModal(true);
                     }}
                     disabled={updatingUser === selectedUser.id}
                     className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                   >
                     Change Role
                   </button>
                   <button
                     onClick={() => resetPassword(selectedUser.id)}
                     disabled={updatingUser === selectedUser.id}
                     className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
                   >
                     Reset Password
                   </button>
                   <button
                     onClick={() => {
                       setShowUserDetail(false);
                       fetchActivityLogs(selectedUser.id);
                     }}
                     disabled={updatingUser === selectedUser.id}
                     className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                   >
                     View Logs
                   </button>
                   <button
                     onClick={() => updateUserStatus(selectedUser.id, 'delete')}
                     disabled={updatingUser === selectedUser.id}
                     className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                   >
                     {updatingUser === selectedUser.id ? '...' : 'Delete'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Role Management Modal */}
       {showRoleModal && selectedUser && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-foreground">Change User Role</h2>
                 <button
                   onClick={() => setShowRoleModal(false)}
                   className="p-2 hover:bg-accent rounded transition-colors"
                 >
                   <X className="w-5 h-5 text-muted-foreground" />
                 </button>
               </div>
               
               <div className="space-y-4">
                 {currentUserRole !== 'owner' && (
                   <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md">
                     <p className="text-sm text-yellow-800 dark:text-yellow-200">
                       ⚠️ Only owners can change user roles. You need owner permissions to perform this action.
                     </p>
                   </div>
                 )}
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">User</label>
                                        <p className="text-foreground mt-1">
                       {selectedUser.name !== 'No name' ? selectedUser.name : selectedUser.email.split('@')[0]} ({selectedUser.email})
                     </p>
                 </div>
                 
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">Current Role</label>
                   <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getRoleColor(selectedUser.role)}`}>
                     {selectedUser.role}
                   </span>
                 </div>
                 
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">New Role</label>
                   <select
                     className={`w-full mt-1 px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${
                       currentUserRole !== 'owner' ? 'opacity-50 cursor-not-allowed' : ''
                     }`}
                     defaultValue={selectedUser.role}
                     disabled={currentUserRole !== 'owner'}
                     onChange={(e) => {
                       if (currentUserRole === 'owner') {
                         const newRole = e.target.value;
                         updateUserRole(selectedUser.id, newRole);
                       }
                     }}
                   >
                     <option value="user">User</option>
                     <option value="moderator">Moderator</option>
                     <option value="admin">Admin</option>
                     <option value="owner">Owner</option>
                   </select>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Activity Logs Modal */}
       {showActivityLogs && selectedUser && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-foreground">Activity Logs</h2>
                 <button
                   onClick={() => setShowActivityLogs(false)}
                   className="p-2 hover:bg-accent rounded transition-colors"
                 >
                   <X className="w-5 h-5 text-muted-foreground" />
                 </button>
               </div>
               
               <div className="mb-4">
                 <h3 className="text-lg font-semibold text-foreground mb-2">
                   {selectedUser.name !== 'No name' ? selectedUser.name : selectedUser.email.split('@')[0]} - Activity History
                 </h3>
                 <p className="text-muted-foreground">
                   Showing login sessions and activity for this user
                 </p>
               </div>

               {activityLogs.length > 0 ? (
                 <div className="space-y-3">
                   {activityLogs.map((log, index) => (
                     <div key={index} className="p-4 border rounded-lg bg-card">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="font-medium text-foreground">{String(log.action || 'Login')}</p>
                           <p className="text-sm text-muted-foreground">
                             {new Date(String(log.timestamp || log.created_at)).toLocaleString()}
                           </p>
                         </div>
                         <div className="text-right">
                           <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                             String(log.status) === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                             String(log.status) === 'failed' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                             'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                           }`}>
                             {String(log.status || 'success')}
                           </span>
                         </div>
                       </div>
                       {log.details && (
                         <p className="text-sm text-muted-foreground mt-2">{String(log.details)}</p>
                       )}
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                   <h3 className="text-lg font-semibold text-foreground mb-2">No activity logs found</h3>
                   <p className="text-muted-foreground">This user has no recorded activity yet.</p>
                 </div>
               )}
             </div>
           </div>
      </div>
       )}
    </div>
  );
} 