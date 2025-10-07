'use client';

import React from 'react';

interface CostTermsTabsProps {
  costTerms: { type: string; item: string }[];
  cancellationPolicy?: string;
}

const CostTermsTabs = ({ costTerms, cancellationPolicy }: CostTermsTabsProps) => {
  const [activeTab, setActiveTab] = React.useState<'inclusions' | 'cancellation'>('inclusions');
  
  if (!costTerms || costTerms.length === 0) return null;
  
  const inclusions = costTerms.filter((c) => c.type === 'inclusion');
  const exclusions = costTerms.filter((c) => c.type === 'exclusion');

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Cost Terms</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">What&#39;s included and cancellation policy</p>
      </div>
      
      {/* Tabs */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6 shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
          <button
            onClick={() => setActiveTab('inclusions')}
            className={`px-6 py-3 font-semibold text-sm transition-colors duration-200 ${
              activeTab === 'inclusions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Inclusions & Exclusions
          </button>
          <button
            onClick={() => setActiveTab('cancellation')}
            className={`px-6 py-3 font-semibold text-sm transition-colors duration-200 ${
              activeTab === 'cancellation'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Cancellation Policy
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'inclusions' && (
            <div className="space-y-6">
              {inclusions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6.5L5.5 9L9 3.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    What&apos;s Included
                  </h3>
                  <ul className="space-y-3">
                    {inclusions.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                        <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6.5L5.5 9L9 3.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <span className="text-base leading-relaxed">{c.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {exclusions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 6h8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    What&apos;s Not Included
                  </h3>
                  <ul className="space-y-3">
                    {exclusions.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                        <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 6h8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </span>
                        <span className="text-base leading-relaxed">{c.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cancellation' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4L4 8M4 4L8 8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Cancellation Policy
              </h3>
              {cancellationPolicy ? (
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-strong:text-gray-900 prose-strong:dark:text-white prose-ul:text-gray-700 prose-ul:dark:text-gray-300 prose-li:text-gray-700 prose-li:dark:text-gray-300">
                  <div dangerouslySetInnerHTML={{ __html: cancellationPolicy }} />
                </div>
              ) : (
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Standard Cancellation Policy</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span><strong>30+ days before:</strong> 90% refund</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span><strong>15-29 days before:</strong> 50% refund</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span><strong>8-14 days before:</strong> 25% refund</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span><strong>Less than 7 days:</strong> No refund</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Note:</strong> Cancellation due to weather conditions or natural disasters will be handled on a case-by-case basis. 
                    We recommend purchasing travel insurance for additional protection.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CostTermsTabs; 