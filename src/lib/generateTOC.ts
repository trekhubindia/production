import { JSDOM } from 'jsdom';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  slug: string;
}

export function generateTableOfContents(htmlContent: string): TOCItem[] {
  if (!htmlContent) return [];

  try {
    // Create a DOM from the HTML content
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Find all heading elements
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocItems: TOCItem[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      const level = parseInt(heading.tagName.charAt(1));
      
      // Generate a URL-friendly slug from the heading text
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() || `heading-${index}`;

      const id = `${slug}-${index}`; // Add index to ensure uniqueness

      tocItems.push({
        id,
        text,
        level,
        slug
      });
    });

    return tocItems;
  } catch (error) {
    console.error('Error generating TOC:', error);
    return [];
  }
}

export function addIdsToContent(htmlContent: string, tocItems: TOCItem[]): string {
  if (!htmlContent || tocItems.length === 0) return htmlContent;

  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading, index) => {
      if (tocItems[index]) {
        heading.id = tocItems[index].id;
        // Add scroll margin for better navigation
        heading.setAttribute('style', 'scrollMarginTop: 100px');
      }
    });

    return dom.serialize();
  } catch (error) {
    console.error('Error adding IDs to content:', error);
    return htmlContent;
  }
}

// Simplified version for client-side use (without JSDOM)
export function generateTOCClient(htmlContent: string): TOCItem[] {
  if (!htmlContent) return [];

  try {
    // Create a temporary div to parse HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocItems: TOCItem[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      const level = parseInt(heading.tagName.charAt(1));
      
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() || `heading-${index}`;

      const id = `${slug}-${index}`;

      tocItems.push({
        id,
        text,
        level,
        slug
      });
    });

    return tocItems;
  } catch (error) {
    console.error('Error generating TOC:', error);
    return [];
  }
}
