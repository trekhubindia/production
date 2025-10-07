'use client';

import { useEffect, useRef } from 'react';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current || !content) return;

    // Add IDs to all headings for TOC navigation
    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading, index) => {
      if (!heading.id) {
        const text = heading.textContent || '';
        const slug = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        heading.id = slug || `heading-${index}`;
        
        // Add scroll margin for better navigation
        (heading as HTMLElement).style.scrollMarginTop = '120px';
      }
    });
    
    // Debug: Log all headings with their IDs
    console.log('BlogContent headings processed:', Array.from(headings).map(h => ({
      text: h.textContent,
      id: h.id,
      tagName: h.tagName
    })));
  }, [content]);

  if (!content) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4">
          📝
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Content coming soon...</p>
      </div>
    );
  }

  return (
    <div 
      ref={contentRef}
      className="prose prose-xl max-w-none text-black dark:text-white 
        prose-headings:text-black dark:prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight prose-headings:scroll-mt-24
        prose-h1:text-5xl prose-h1:font-black prose-h1:mb-10 prose-h1:mt-16 prose-h1:leading-tight
        prose-h2:text-4xl prose-h2:font-black prose-h2:mb-8 prose-h2:mt-14 prose-h2:leading-tight
        prose-h3:text-3xl prose-h3:font-bold prose-h3:mb-6 prose-h3:mt-12 prose-h3:leading-tight
        prose-h4:text-2xl prose-h4:font-bold prose-h4:mb-5 prose-h4:mt-10
        prose-h5:text-xl prose-h5:font-bold prose-h5:mb-4 prose-h5:mt-8
        prose-h6:text-lg prose-h6:font-bold prose-h6:mb-3 prose-h6:mt-6
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-8 prose-p:mt-0
        prose-a:text-black dark:prose-a:text-white prose-a:underline prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:decoration-4
        prose-strong:text-black dark:prose-strong:text-white prose-strong:font-bold
        prose-blockquote:border-l-black dark:prose-blockquote:border-l-white prose-blockquote:border-l-4 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-900 prose-blockquote:p-8 prose-blockquote:rounded-2xl prose-blockquote:my-10 prose-blockquote:font-medium prose-blockquote:text-lg
        prose-ul:my-8 prose-ul:space-y-3 prose-li:my-0 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:leading-relaxed prose-li:text-lg
        prose-ol:my-8 prose-ol:space-y-3 prose-code:bg-gray-100 dark:prose-code:bg-gray-900 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
        prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 prose-pre:p-6 prose-pre:rounded-2xl prose-pre:overflow-x-auto prose-pre:my-8
        prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-10
        prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-hr:my-12"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
