'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageSquare, Star, Calendar, User } from 'lucide-react';
import { TrekFAQ, FAQFilters } from '@/lib/types/faq-types';
import { useAuth } from '@/hooks/context/AuthContext';

interface FAQListProps {
  trekSlug?: string;
  initialFaqs?: TrekFAQ[];
  showTrekName?: boolean;
  limit?: number;
  featured?: boolean;
}

export default function FAQList({
  trekSlug,
  initialFaqs,
  showTrekName = false,
  limit = 20,
  featured = false
}: FAQListProps) {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<TrekFAQ[]>(initialFaqs || []);
  const [loading, setLoading] = useState(!initialFaqs);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote'>>({});

  useEffect(() => {
    if (!initialFaqs) {
      fetchFaqs();
    }
  }, [trekSlug, featured]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (trekSlug) params.append('trek_slug', trekSlug);
      if (featured) params.append('featured', 'true');
      params.append('limit', limit.toString());

      const response = await fetch(`/api/faqs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFaqs(data.faqs || []);
        // Auto-expand featured FAQs
        if (featured) {
          setExpandedFaqs(new Set(data.faqs?.map((faq: TrekFAQ) => faq.id) || []));
        }
      } else {
        console.error('Error fetching FAQs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = async (faqId: string) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
      // Increment view count when expanding
      try {
        await fetch(`/api/faqs/${faqId}/view`, { method: 'POST' });
        // Update local view count
        setFaqs(prev => prev.map(faq => 
          faq.id === faqId ? { ...faq, views: faq.views + 1 } : faq
        ));
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    }
    setExpandedFaqs(newExpanded);
  };

  const handleVote = async (faqId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) return;

    try {
      const currentVote = userVotes[faqId];
      let method = 'POST';
      let endpoint = `/api/faqs/${faqId}/vote`;

      // If user already voted the same way, remove the vote
      if (currentVote === voteType) {
        method = 'DELETE';
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local vote state
        if (currentVote === voteType) {
          // Remove vote
          setUserVotes(prev => {
            const newVotes = { ...prev };
            delete newVotes[faqId];
            return newVotes;
          });
        } else {
          // Add or change vote
          setUserVotes(prev => ({ ...prev, [faqId]: voteType }));
        }

        // Update FAQ vote counts
        setFaqs(prev => prev.map(faq => 
          faq.id === faqId 
            ? { 
                ...faq, 
                upvotes: data.upvotes || faq.upvotes,
                downvotes: data.downvotes || faq.downvotes
              }
            : faq
        ));
      }
    } catch (error) {
      console.error('Error voting on FAQ:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      timing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      difficulty: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      permits: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
      accommodation: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      packing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
      food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
      safety: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300'
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {featured ? 'No featured questions yet' : 'No questions yet'}
        </h3>
        <p className="text-muted-foreground">
          {featured 
            ? 'Check back later for featured questions and answers.'
            : 'Be the first to ask a question about this trek!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq) => {
        const isExpanded = expandedFaqs.has(faq.id);
        const userVote = userVotes[faq.id];
        
        return (
          <div key={faq.id} className="bg-card rounded-lg border overflow-hidden">
            {/* Question Header */}
            <button
              onClick={() => toggleExpanded(faq.id)}
              className="w-full p-6 text-left hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(faq.category)}`}>
                      {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                    </span>
                    {faq.is_featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  {/* Question */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 pr-4">
                    {faq.question}
                  </h3>
                  
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{faq.user_name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(faq.created_at)}</span>
                    </div>
                    {showTrekName && faq.trek_name && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{faq.trek_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Vote Counts */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{faq.upvotes}</span>
                  </div>
                  
                  {/* Expand Icon */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>

            {/* Answer Content */}
            {isExpanded && faq.answer && (
              <div className="px-6 pb-6">
                <div className="border-t border-border pt-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <div className="whitespace-pre-wrap">{faq.answer}</div>
                  </div>
                  
                  {/* Vote Buttons */}
                  {user && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground mr-2">
                        Was this helpful?
                      </span>
                      <button
                        onClick={() => handleVote(faq.id, 'upvote')}
                        className={`
                          flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors
                          ${userVote === 'upvote' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }
                        `}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{faq.upvotes}</span>
                      </button>
                      <button
                        onClick={() => handleVote(faq.id, 'downvote')}
                        className={`
                          flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors
                          ${userVote === 'downvote' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }
                        `}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{faq.downvotes}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
