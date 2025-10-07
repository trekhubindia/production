'use client';

import { useState } from 'react';
import { MessageSquare, Plus, X, CheckCircle } from 'lucide-react';
import QuestionForm from './QuestionForm';
import FAQList from './FAQList';
import { CreateFAQRequest } from '@/lib/types/faq-types';
import { useAuth } from '@/hooks/context/AuthContext';

interface TrekFAQSectionProps {
  trekId: string;
  trekSlug: string;
  trekName: string;
  className?: string;
}

export default function TrekFAQSection({
  trekId,
  trekSlug,
  trekName,
  className = ''
}: TrekFAQSectionProps) {
  const { user } = useAuth();
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitQuestion = async (questionData: CreateFAQRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit question');
      }

      setSuccessMessage(data.message || 'Question submitted successfully!');
      setShowQuestionForm(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (err) {
      console.error('Error submitting question:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Questions & Answers
            </h2>
            <p className="text-muted-foreground">
              Get answers from our experts and fellow trekkers
            </p>
          </div>
        </div>

        {/* Ask Question Button */}
        {user && !showQuestionForm && (
          <button
            onClick={() => setShowQuestionForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ask Question
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Question Form */}
      {showQuestionForm && (
        <QuestionForm
          trekId={trekId}
          trekName={trekName}
          onSubmit={handleSubmitQuestion}
          onCancel={() => setShowQuestionForm(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* Featured FAQs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Featured Questions
        </h3>
        <FAQList
          trekSlug={trekSlug}
          featured={true}
          limit={5}
        />
      </div>

      {/* All FAQs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          All Questions
        </h3>
        <FAQList
          trekSlug={trekSlug}
          featured={false}
          limit={20}
        />
      </div>

      {/* Call to Action for Non-Authenticated Users */}
      {!user && (
        <div className="bg-muted/20 rounded-lg p-6 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Have a question about this trek?
          </h3>
          <p className="text-muted-foreground mb-4">
            Sign in to ask questions and get answers from our experts and fellow trekkers.
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Sign In to Ask Question
          </a>
        </div>
      )}
    </div>
  );
}
