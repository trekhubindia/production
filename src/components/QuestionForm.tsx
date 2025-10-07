'use client';

import { useState } from 'react';
import { MessageSquare, Send, User, UserX, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/context/AuthContext';
import { FAQ_CATEGORIES, CreateFAQRequest } from '@/lib/types/faq-types';

interface QuestionFormProps {
  trekId: string;
  trekName: string;
  onSubmit: (question: CreateFAQRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function QuestionForm({
  trekId,
  trekName,
  onSubmit,
  onCancel,
  isLoading = false
}: QuestionFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    question: '',
    is_anonymous: false,
    category: 'general'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.question.trim().length < 10) {
      newErrors.question = 'Question must be at least 10 characters long';
    }

    if (formData.question.trim().length > 500) {
      newErrors.question = 'Question must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        trek_id: trekId,
        question: formData.question.trim(),
        is_anonymous: formData.is_anonymous,
        category: formData.category
      });
      
      // Reset form on success
      setFormData({
        question: '',
        is_anonymous: false,
        category: 'general'
      });
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  if (!user) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Sign in to ask a question
        </h3>
        <p className="text-muted-foreground mb-4">
          You need to be logged in to ask questions about this trek.
        </p>
        <a
          href="/auth"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Ask a Question
          </h3>
          <p className="text-sm text-muted-foreground">
            About <strong>{trekName}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Question Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Your Question *
          </label>
          <textarea
            value={formData.question}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, question: e.target.value }));
              if (errors.question) {
                setErrors(prev => ({ ...prev, question: '' }));
              }
            }}
            placeholder="What would you like to know about this trek? Be specific to get the best answer..."
            rows={4}
            className="w-full px-3 py-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
          <div className="flex justify-between items-center">
            {errors.question && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.question}
              </p>
            )}
            <p className="text-xs text-muted-foreground ml-auto">
              {formData.question.length}/500 characters
            </p>
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Privacy Settings
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_anonymous: false }))}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${!formData.is_anonymous 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-background border-input text-muted-foreground hover:bg-muted'
                }
              `}
            >
              <User className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Show my name</div>
                <div className="text-xs opacity-75">
                  {user.name || user.email}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_anonymous: true }))}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${formData.is_anonymous 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-background border-input text-muted-foreground hover:bg-muted'
                }
              `}
            >
              <UserX className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Ask anonymously</div>
                <div className="text-xs opacity-75">
                  Your name won't be shown
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || formData.question.trim().length < 10}
            className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask Question
              </>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 border border-input rounded-lg font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tips for better answers:</strong> Be specific about what you want to know. 
          Include details about your experience level, concerns, or specific aspects of the trek you're curious about.
        </p>
      </div>
    </div>
  );
}
