'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Calendar,
  Filter,
  Users,
  TrendingUp,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface BookingExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBookings: number;
  bookingStats: {
    pending_approval: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

interface ExportFilters {
  format: ExportFormat;
  status: string;
  startDate: string;
  endDate: string;
  trekSlug: string;
  userFilter: string;
  specificUser: string;
}

const formatOptions = [
  {
    value: 'csv' as ExportFormat,
    label: 'CSV (Excel Compatible)',
    icon: FileSpreadsheet,
    description: 'Comma-separated values, perfect for Excel and Google Sheets',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    value: 'json' as ExportFormat,
    label: 'JSON (Developer Friendly)',
    icon: FileJson,
    description: 'Structured data with summary statistics and metadata',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    value: 'excel' as ExportFormat,
    label: 'Excel Spreadsheet',
    icon: FileSpreadsheet,
    description: 'Native Excel format with formatting',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  {
    value: 'pdf' as ExportFormat,
    label: 'PDF Report',
    icon: FileText,
    description: 'Formatted report for printing and sharing',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
];

const statusOptions = [
  { value: 'all', label: 'All Statuses', color: 'text-gray-600' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'text-orange-600' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-green-600' },
  { value: 'completed', label: 'Completed', color: 'text-purple-600' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' }
];

const userExportOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'specific', label: 'Specific User' },
  { value: 'high_risk', label: 'High Risk Customers Only' },
  { value: 'medical_concerns', label: 'Medical Concerns Only' },
  { value: 'first_time', label: 'First-time Trekkers' },
  { value: 'experienced', label: 'Experienced Trekkers' }
];

export default function BookingExportModal({ 
  isOpen, 
  onClose, 
  totalBookings, 
  bookingStats 
}: BookingExportModalProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    format: 'csv',
    status: 'all',
    startDate: '',
    endDate: '',
    trekSlug: '',
    userFilter: 'all',
    specificUser: ''
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const params = new URLSearchParams();
      params.append('format', filters.format);
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.trekSlug) params.append('trekSlug', filters.trekSlug);
      if (filters.userFilter !== 'all') params.append('userFilter', filters.userFilter);
      if (filters.specificUser) params.append('specificUser', filters.specificUser);

      const response = await fetch(`/api/admin/bookings/export?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
                     `nomadic-travels-bookings.${filters.format}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormat = formatOptions.find(f => f.value === filters.format);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Booking Data</h2>
                  <p className="text-gray-600">Download booking information in your preferred format</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{bookingStats.pending_approval}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">Confirmed</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{bookingStats.confirmed}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{bookingStats.completed}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Export Format Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Choose Export Format
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formatOptions.map((format) => {
                    const Icon = format.icon;
                    const isSelected = filters.format === format.value;
                    
                    return (
                      <motion.button
                        key={format.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFilters(prev => ({ ...prev, format: format.value }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected 
                            ? `${format.borderColor} ${format.bgColor} shadow-md` 
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-6 h-6 ${isSelected ? format.color : 'text-gray-400'}`} />
                          <div>
                            <h4 className={`font-semibold ${isSelected ? format.color : 'text-gray-900'}`}>
                              {format.label}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Booking Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value} className={option.color}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* User Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User Filter
                    </label>
                    <select
                      value={filters.userFilter}
                      onChange={(e) => setFilters(prev => ({ ...prev, userFilter: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {userExportOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specific User Input */}
                  {filters.userFilter === 'specific' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        User Email/ID
                      </label>
                      <input
                        type="text"
                        placeholder="Enter user email or ID"
                        value={filters.specificUser}
                        onChange={(e) => setFilters(prev => ({ ...prev, specificUser: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* Trek Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specific Trek
                    </label>
                    <input
                      type="text"
                      placeholder="Trek slug (optional)"
                      value={filters.trekSlug}
                      onChange={(e) => setFilters(prev => ({ ...prev, trekSlug: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Export Preview */}
              {selectedFormat && (
                <div className={`p-4 rounded-xl ${selectedFormat.bgColor} dark:${selectedFormat.bgColor.replace('bg-', 'bg-opacity-20 bg-')} border ${selectedFormat.borderColor} dark:${selectedFormat.borderColor.replace('border-', 'border-opacity-30 border-')}`}>
                  <h4 className={`font-semibold ${selectedFormat.color} mb-2`}>
                    Export Preview: {selectedFormat.label}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Your export will include: Customer details, trek information, booking status, 
                    payment details, dates, special requirements, emergency contacts, and guide insights.
                  </p>
                  
                  {/* Applied Filters Summary */}
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Applied Filters:</h5>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        Status: {statusOptions.find(s => s.value === filters.status)?.label || 'All'}
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                        Users: {userExportOptions.find(u => u.value === filters.userFilter)?.label || 'All'}
                      </span>
                      {filters.startDate && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                          From: {filters.startDate}
                        </span>
                      )}
                      {filters.endDate && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                          To: {filters.endDate}
                        </span>
                      )}
                      {filters.trekSlug && (
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded">
                          Trek: {filters.trekSlug}
                        </span>
                      )}
                      {filters.specificUser && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                          User: {filters.specificUser}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {filters.format === 'json' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <strong>Bonus:</strong> JSON format includes guide insights, risk assessments, and detailed analytics.
                    </p>
                  )}
                  {filters.format === 'pdf' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <strong>Guide Report:</strong> Includes emergency contact quick reference and safety checklist.
                    </p>
                  )}
                  {filters.userFilter !== 'all' && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      <strong>Filtered Export:</strong> Only {userExportOptions.find(u => u.value === filters.userFilter)?.label.toLowerCase()} will be included.
                    </p>
                  )}
                </div>
              )}

              {/* Export Status */}
              {exportError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Export Failed</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{exportError}</p>
                </div>
              )}

              {exportSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Export Successful!</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">Your file has been downloaded.</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ready to export {filters.status === 'all' ? 'all' : filters.status} bookings
                {filters.userFilter !== 'all' && ` (${userExportOptions.find(u => u.value === filters.userFilter)?.label})`}
                {filters.startDate && ` from ${filters.startDate}`}
                {filters.endDate && ` to ${filters.endDate}`}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isExporting}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  disabled={isExporting || exportSuccess}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : exportSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Exported!
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export Data
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
