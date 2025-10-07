'use client';

import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  tableOfContents?: string; // JSON string of TOC items
  content?: string; // Fallback for legacy blogs
}

export default function TableOfContents({ tableOfContents, content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // First try to use pre-generated TOC from database
    if (tableOfContents) {
      try {
        const parsedTOC = JSON.parse(tableOfContents);
        setTocItems(parsedTOC);
        return;
      } catch (error) {
        console.error('Error parsing table of contents:', error);
      }
    }

    // Fallback: Parse headings from content for legacy blogs
    const parseHeadings = () => {
      if (!content) return [];

      // Create a temporary div to parse HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const items: TOCItem[] = [];

      headings.forEach((heading, index) => {
        const text = heading.textContent || '';
        const level = parseInt(heading.tagName.charAt(1));
        
        // Generate consistent ID using the same logic as BlogContent and API
        let id = heading.id; // Check if heading already has an ID
        
        if (!id) {
          // Generate ID from text content (same as BlogContent.tsx)
          id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim() || `heading-${index}`;
        }

        items.push({ id, text, level });
      });

      return items;
    };

    // Set TOC items after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const items = parseHeadings();
      setTocItems(items);
      
      // Debug: Log the generated TOC items
      console.log('Generated TOC items:', items);
    }, 500); // Increased delay to ensure BlogContent has processed

    return () => clearTimeout(timer);
  }, [tableOfContents, content]);

  useEffect(() => {
    // Intersection Observer for active heading detection
    const observerOptions = {
      rootMargin: '-20% 0% -35% 0%',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all headings
    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    console.log('Attempting to scroll to:', id);
    const element = document.getElementById(id);
    
    if (element) {
      console.log('Found element:', element);
      const offset = 120; // Account for sticky header and some padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active ID immediately for better UX
      setActiveId(id);
    } else {
      console.warn('Element not found for ID:', id);
      
      // Try alternative approaches if direct ID lookup fails
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const targetHeading = Array.from(headings).find(h => {
        const text = h.textContent || '';
        const generatedId = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        return generatedId === id || h.id === id;
      });
      
      if (targetHeading) {
        console.log('Found heading via text match:', targetHeading);
        targetHeading.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        setActiveId(id);
      }
    }
  };

  if (tocItems.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-3">
          <BookOpen className="w-5 h-5" />
          Table of Contents
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No headings found in this article.
        </p>
      </div>
    );
  }

  // Limit to first 6 items and only show H1, H2, H3 for brevity
  const filteredItems = tocItems
    .filter(item => item.level <= 3)
    .slice(0, 6);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        Contents
      </h3>
      <nav className="space-y-1">
        {filteredItems.map(({ id, text, level }) => {
          // Truncate long titles
          const truncatedText = text.length > 40 ? text.substring(0, 40) + '...' : text;
          
          return (
            <button
              key={id}
              onClick={() => scrollToHeading(id)}
              className={`
                block w-full text-left py-1.5 px-2 rounded-md transition-all duration-200 text-sm
                ${level === 1 ? 'font-semibold' : ''}
                ${level === 2 ? 'font-medium ml-2' : ''}
                ${level >= 3 ? 'ml-4' : ''}
                ${activeId === id 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              title={text} // Show full text on hover
            >
              {truncatedText}
            </button>
          );
        })}
        {tocItems.length > 6 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
            +{tocItems.length - 6} more sections
          </p>
        )}
      </nav>
    </div>
  );
}
