'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Send, User, Clock } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  author: string;
  answeredBy: string;
  featured: boolean;
  createdAt: string;
  answeredAt: string;
}

interface DynamicFAQSectionProps {
  trekSlug: string;
  trekName: string;
}

export default function DynamicFAQSection({ trekSlug, trekName }: DynamicFAQSectionProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  
  // Question form state
  const [questionForm, setQuestionForm] = useState({
    question: '',
    is_anonymous: false,
    category: 'general'
  });

  // Load FAQs
  useEffect(() => {
    const loadFAQs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/treks/${trekSlug}/faqs`);
        
        if (response.ok) {
          const data = await response.json();
          setFaqs(data.faqs || []);
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

    if (trekSlug) {
      loadFAQs();
    }
  }, [trekSlug]);

  // Submit new question
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionForm.question.trim()) {
      setSubmitMessage('Please enter a question');
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch(`/api/treks/${trekSlug}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionForm.question.trim(),
          is_anonymous: questionForm.is_anonymous,
          category: questionForm.category
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage('Question submitted successfully! Our team will answer it soon.');
        setQuestionForm({ question: '', is_anonymous: false, category: 'general' });
        setShowQuestionForm(false);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSubmitMessage(''), 5000);
      } else {
        setSubmitMessage(data.error || 'Failed to submit question');
      }
    } catch (err) {
      setSubmitMessage('Error submitting question');
      console.error('Submit question error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            FAQs about {trekName}
          </h2>
          <button
            onClick={() => setShowQuestionForm(!showQuestionForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Ask Question
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {faqs.length > 0 
            ? `${faqs.length} questions answered by our team`
            : 'Be the first to ask a question about this trek!'
          }
        </p>
      </div>

      {/* Submit Message */}
      {submitMessage && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${
          submitMessage.includes('successfully') 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {submitMessage}
        </div>
      )}

      {/* Question Form */}
      {showQuestionForm && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ask a Question</h3>
          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Question *
              </label>
              <textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="What would you like to know about this trek?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={questionForm.category}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="timing">Best Time to Visit</option>
                  <option value="difficulty">Difficulty & Fitness</option>
                  <option value="permits">Permits & Documentation</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="packing">Packing & Gear</option>
                  <option value="food">Food & Meals</option>
                  <option value="transportation">Transportation</option>
                  <option value="safety">Safety & Health</option>
                  <option value="cost">Cost & Payment</option>
                  <option value="weather">Weather Conditions</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Privacy
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="anonymous"
                      checked={!questionForm.is_anonymous}
                      onChange={() => setQuestionForm(prev => ({ ...prev, is_anonymous: false }))}
                      className="mr-2"
                    />
                    Show my name
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="anonymous"
                      checked={questionForm.is_anonymous}
                      onChange={() => setQuestionForm(prev => ({ ...prev, is_anonymous: true }))}
                      className="mr-2"
                    />
                    Ask anonymously
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !questionForm.question.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Question'}
              </button>
              <button
                type="button"
                onClick={() => setShowQuestionForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQs List */}
      {error ? (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No questions yet for this trek</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Be the first to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden transition-all duration-200 ${
                faq.featured ? 'ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {faq.featured && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                          Featured
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <User className="w-3 h-3" />
                        <span>{faq.author}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{new Date(faq.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="ml-4">
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
              
              {expandedFaq === faq.id && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <div className="pt-4">
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                      <div dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br>') }} />
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Answered by <strong>{faq.answeredBy}</strong> on {new Date(faq.answeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
