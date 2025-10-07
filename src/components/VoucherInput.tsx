'use client';

import { useState, useEffect } from 'react';
import { Tag, Check, X, Loader2, Percent } from 'lucide-react';

interface VoucherInputProps {
  amount: number;
  userId?: string;
  onVoucherApplied: (discount: number, finalAmount: number, voucherId: string, voucherCode?: string) => void;
  onVoucherRemoved: () => void;
  disabled?: boolean;
}

interface VoucherValidationResult {
  valid: boolean;
  voucher?: {
    id: string;
    code: string;
    discount_percent: number;
    valid_until: string;
    is_used: boolean;
    user_id: string | null;
  };
  error?: string;
  discount_amount?: number;
  final_amount?: number;
}

export default function VoucherInput({ 
  amount, 
  userId, 
  onVoucherApplied, 
  onVoucherRemoved,
  disabled = false 
}: VoucherInputProps) {
  const [voucherCode, setVoucherCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidationResult | null>(null);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(false);

  const validateVoucher = async (code: string) => {
    if (!code.trim()) {
      setError('Please enter a voucher code');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          amount,
          userId
        })
      });

      const result: VoucherValidationResult = await response.json();

      if (result.valid && result.voucher && result.discount_amount !== undefined && result.final_amount !== undefined) {
        setAppliedVoucher(result);
        onVoucherApplied(result.discount_amount, result.final_amount, result.voucher.id, result.voucher.code);
        setShowInput(false);
      } else {
        setError(result.error || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      setError('Failed to validate voucher. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setError('');
    setShowInput(false);
    onVoucherRemoved();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateVoucher(voucherCode);
  };

  if (appliedVoucher && appliedVoucher.valid) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">
                Voucher Applied: {appliedVoucher.voucher?.code}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {appliedVoucher.voucher?.discount_percent}% discount • Save ₹{appliedVoucher.discount_amount?.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={removeVoucher}
            disabled={disabled}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        disabled={disabled}
        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Tag className="w-4 h-4" />
        Have a voucher code?
      </button>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 mb-3">
        <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="font-medium text-gray-900 dark:text-white">Apply Voucher Code</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Enter voucher code"
            disabled={disabled || isValidating}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || isValidating || !voucherCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </button>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        
        <button
          type="button"
          onClick={() => {
            setShowInput(false);
            setVoucherCode('');
            setError('');
          }}
          disabled={disabled || isValidating}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
