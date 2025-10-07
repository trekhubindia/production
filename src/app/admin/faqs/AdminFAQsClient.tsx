'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  EyeOff, 
  Star, 
  Search, 
  Filter,
  Edit3,
  Save,
  X,
  Trash2,
  User,
  Mail,
  Calendar,
  Mountain
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FAQ {
  id: string;
  trek_slug: string;
  question: string;
  answer?: string;
  user_name?: string;
  user_email?: string;
  status: 'pending' | 'answered' | 'hidden';
  is_featured: boolean;
  answered_by?: string;
  created_at: string;
  updated_at?: string;
  answered_at?: string;
  treks?: {
    name: string;
    slug: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  answered: number;
  hidden: number;
}

export default function AdminFAQsClient() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, answered: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Edit state
  const [editingFAQ, setEditingFAQ] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    answer: '',
    status: 'pending' as 'pending' | 'answered' | 'hidden',
    is_featured: false,
    answered_by: ''
  });
  const [saving, setSaving] = useState(false);

  // Load FAQs
  const loadFAQs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/admin/faqs?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
        setStats(data.stats || { total: 0, pending: 0, answered: 0, hidden: 0 });
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError('Failed to load FAQs');
      }
    } catch (err) {
      setError('Error loading FAQs');
      console.error('FAQ loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load FAQs when filters change
  useEffect(() => {
    loadFAQs();
  }, [statusFilter, currentPage]);

  // Start editing FAQ
  const startEditing = (faq: FAQ) => {
    setEditingFAQ(faq.id);
    setEditForm({
      answer: faq.answer || '',
      status: faq.status,
      is_featured: faq.is_featured,
      answered_by: faq.answered_by || ''
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingFAQ(null);
    setEditForm({ answer: '', status: 'pending', is_featured: false, answered_by: '' });
  };

  // Save FAQ changes
  const saveFAQ = async (faqId: string) => {
    if (!editForm.answer.trim()) {
      alert('Answer is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/faqs/${faqId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await loadFAQs(); // Reload data
        setEditingFAQ(null);
        setEditForm({ answer: '', status: 'pending', is_featured: false, answered_by: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save FAQ');
      }
    } catch (err) {
      alert('Error saving FAQ');
      console.error('Save FAQ error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete FAQ
  const deleteFAQ = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/faqs/${faqId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFAQs(); // Reload data
      } else {
        alert('Failed to delete FAQ');
      }
    } catch (err) {
      alert('Error deleting FAQ');
      console.error('Delete FAQ error:', err);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'answered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Answered
          </span>
        );
      case 'hidden':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 rounded-full text-xs font-medium">
            <EyeOff className="w-3 h-3" />
            Hidden
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
                FAQ Management
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Manage user questions and provide helpful answers for trek FAQs</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
              <CardContent className="flex flex-row items-center justify-between p-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total FAQs</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">All questions</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
              <CardContent className="flex flex-row items-center justify-between p-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
              <CardContent className="flex flex-row items-center justify-between p-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Answered</p>
                  <p className="text-3xl font-bold text-foreground">{stats.answered}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
              <CardContent className="flex flex-row items-center justify-between p-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Hidden</p>
                  <p className="text-3xl font-bold text-foreground">{stats.hidden}</p>
                  <p className="text-xs text-muted-foreground">Not visible</p>
                </div>
                <div className="bg-gray-500/10 p-3 rounded-full">
                  <EyeOff className="w-6 h-6 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters */}
          <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Search FAQs
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search questions, answers, or trek names..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Filter by Status
                    </label>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10 pr-8 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 min-w-[140px]"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="answered">Answered</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={loadFAQs}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="p-4">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* FAQs List */}
          <div className="space-y-4">
            {faqs.length === 0 ? (
              <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
                <CardContent className="p-16 text-center">
                  <div className="bg-primary/10 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <MessageCircle className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">No FAQs Found</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                    {statusFilter === 'all' 
                      ? 'No questions have been submitted yet. When users ask questions about treks, they will appear here.' 
                      : `No ${statusFilter} questions found. Try adjusting your filters or search terms.`
                    }
                  </p>
                  {statusFilter !== 'all' && (
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Clear Filters
                    </button>
                  )}
                </CardContent>
              </Card>
            ) : (
              faqs.map((faq) => (
                <Card key={faq.id} className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)] transition-all duration-200 hover:shadow-xl">
                  <CardContent className="p-8">
              {/* FAQ Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusBadge(faq.status)}
                    {faq.is_featured && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-300 rounded-full text-xs font-semibold border border-yellow-300 dark:border-yellow-700">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                        <Mountain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">{faq.treks?.name || faq.trek_slug}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                        <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span>{faq.user_name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span>{new Date(faq.created_at).toLocaleDateString()}</span>
                    </div>
                    {faq.answered_by && (
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-lg">
                          <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span>By: {faq.answered_by}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {editingFAQ !== faq.id && (
                    <>
                      <button
                        onClick={() => startEditing(faq)}
                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Edit FAQ"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteFAQ(faq.id)}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Question</h4>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                        {faq.question}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer Section */}
              {editingFAQ === faq.id ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-500 p-2 rounded-lg shadow-sm">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-green-800 dark:text-green-200">Edit Answer</h4>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
                      Answer Content
                    </label>
                    <textarea
                      value={editForm.answer}
                      onChange={(e) => setEditForm(prev => ({ ...prev, answer: e.target.value }))}
                      rows={6}
                      className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Provide a comprehensive and helpful answer to this question..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="answered">Answered</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                        Answered By
                      </label>
                      <input
                        type="text"
                        value={editForm.answered_by}
                        onChange={(e) => setEditForm(prev => ({ ...prev, answered_by: e.target.value }))}
                        placeholder="Your name or Admin Team"
                        className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          id={`featured-${faq.id}`}
                          checked={editForm.is_featured}
                          onChange={(e) => setEditForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                          className="w-5 h-5 text-green-600 bg-white border-green-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                          Featured FAQ
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <button
                      onClick={() => saveFAQ(faq.id)}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Answer'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  {faq.answer ? (
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="bg-gray-500 p-2 rounded-lg shadow-sm">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Answer</h4>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                      {faq.answered_at && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Answered on {new Date(faq.answered_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 italic text-lg">
                        No answer provided yet
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Click the edit button above to add an answer
                      </p>
                    </div>
                  )}
                </div>
              )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
