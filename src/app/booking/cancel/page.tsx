'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Footer from '@/components/Footer';

export default function BookingCancelPage() {
  return (
    <>
      {/* Cancel Hero Section */}
      <section className="relative min-h-[60vh] bg-gradient-to-br from-red-900 via-orange-900 to-red-900 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/images/mountain-bg.jpg')] bg-cover bg-center opacity-20 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm border border-red-400/30 px-6 py-3 rounded-full text-sm font-medium mb-6">
              <XCircle className="w-5 h-5" />
              <span>Booking Cancelled</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 drop-shadow-2xl bg-gradient-to-r from-white via-red-100 to-orange-100 bg-clip-text text-transparent leading-tight">
            Payment
            <br />
            <span className="text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text">
              Cancelled
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed mb-12 font-light">
            No worries! Your payment was cancelled and no charges were made. You can try again anytime.
          </p>
        </div>
      </section>

      {/* Cancel Details Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Cancelled
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your payment was cancelled successfully. No charges were made to your account.
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What Happened?
              </h3>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p>• You cancelled the payment during the checkout process</p>
                <p>• No charges were made to your payment method</p>
                <p>• Your booking was not confirmed</p>
                <p>• You can try booking again anytime</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                Need Help?
              </h3>
              <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                <p>• Contact our support team for assistance</p>
                <p>• Check your internet connection</p>
                <p>• Ensure your payment method is valid</p>
                <p>• Try using a different payment method</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/treks"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Treks
              </Link>
              <Link
                href="/contact"
                className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-4 px-8 rounded-2xl font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
} 