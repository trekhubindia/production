import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with the correct API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY as string);

// Fallback function to extract content from raw AI response
function extractContentFromRawResponse(rawResponse: string, topic: string, category: string) {
  try {
    // Clean the response
    let content = rawResponse.trim();
    
    // Remove any JSON markers or code blocks
    content = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^\{[\s\S]*?"content":\s*"/, '')
      .replace(/"[^"]*$/, '');
    
    // If content is too short, create a basic structure
    if (content.length < 200) {
      content = createBasicBlogContent(topic, category);
    }
    
    // Generate title from topic if not found
    let title = topic;
    const titleMatch = content.match(/(?:title|Title):\s*"?([^"\n]+)"?/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else if (!title.includes('Guide') && !title.includes('Tips')) {
      title = `Complete Guide to ${topic}`;
    }
    
    // Extract or generate summary
    let summary = `Learn everything you need to know about ${topic.toLowerCase()}. This comprehensive guide covers essential tips, safety considerations, and expert advice.`;
    const summaryMatch = content.match(/(?:summary|Summary):\s*"?([^"\n]+)"?/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }
    
    // Clean and structure the content
    let blogContent = content
      .replace(/(?:title|Title):\s*"?[^"\n]+"?\n?/gi, '')
      .replace(/(?:summary|Summary):\s*"?[^"\n]+"?\n?/gi, '')
      .replace(/(?:slug|Slug):\s*"?[^"\n]+"?\n?/gi, '')
      .trim();
    
    // If content doesn't have proper structure, add it
    if (!blogContent.includes('<h2>') && !blogContent.includes('##')) {
      blogContent = structureContent(blogContent, topic);
    }
    
    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Estimate read time
    const wordCount = blogContent.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' min read';
    
    return {
      title: title,
      slug: slug,
      summary: summary,
      content: blogContent,
      category: category,
      read_time: readTime,
      author: 'Expert Guide Team',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop'
    };
  } catch (error) {
    console.error('Error in extractContentFromRawResponse:', error);
    return null;
  }
}

// Create basic blog content structure
function createBasicBlogContent(topic: string, category: string): string {
  return `
<p>Welcome to our comprehensive guide on ${topic}. Whether you're a beginner or experienced adventurer, this guide will provide you with essential information and expert tips.</p>

<h2>Understanding ${topic}</h2>
<p>Before diving into the details, it's important to understand the fundamentals of ${topic.toLowerCase()}. This knowledge will help you make informed decisions and ensure a safe, enjoyable experience.</p>

<h2>Essential Preparation</h2>
<p>Proper preparation is key to success. Here are the essential steps you need to take before embarking on your adventure:</p>
<ul>
<li>Research and planning</li>
<li>Physical fitness preparation</li>
<li>Gear and equipment check</li>
<li>Weather and seasonal considerations</li>
</ul>

<h2>Safety Considerations</h2>
<p>Safety should always be your top priority. Understanding potential risks and how to mitigate them is crucial for a successful experience.</p>

<h2>Pro Tips and Best Practices</h2>
<p>Learn from the experts with these proven tips and best practices that will enhance your experience and help you avoid common mistakes.</p>

<h2>Conclusion</h2>
<p>With proper preparation, knowledge, and the right mindset, you'll be well-equipped to tackle ${topic.toLowerCase()}. Remember to always prioritize safety and enjoy the journey.</p>
  `.trim();
}

// Structure unformatted content
function structureContent(content: string, topic: string): string {
  // Split content into paragraphs
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length < 3) {
    return createBasicBlogContent(topic, 'Guide');
  }
  
  let structured = '';
  
  // Add introduction
  structured += `<p>${paragraphs[0]}</p>\n\n`;
  
  // Add sections with headings
  const sections = [
    'Understanding the Basics',
    'Essential Preparation',
    'Step-by-Step Guide',
    'Safety Considerations',
    'Pro Tips and Best Practices',
    'Common Mistakes to Avoid',
    'Conclusion'
  ];
  
  let sectionIndex = 0;
  for (let i = 1; i < paragraphs.length && sectionIndex < sections.length; i++) {
    if (i % 2 === 1 && sectionIndex < sections.length - 1) {
      structured += `<h2>${sections[sectionIndex]}</h2>\n`;
      sectionIndex++;
    }
    structured += `<p>${paragraphs[i]}</p>\n\n`;
  }
  
  return structured.trim();
}

// Process and format content from AI response
function processContentFormatting(content: string): string {
  if (!content) return '';
  
  // First, handle the specific case where content has literal \n sequences
  if (content.includes('\\n')) {
    console.log('Processing content with literal \\n sequences...');
    content = content
      // Replace literal \n\n with double line breaks
      .replace(/\\n\\n/g, '\n\n')
      // Replace single literal \n with single line breaks
      .replace(/\\n/g, '\n');
  }
  
  // Clean up escaped characters and newlines from JSON
  let processed = content
    // Convert \n to actual line breaks (handle both literal and escaped)
    .replace(/\\n/g, '\n')
    // Convert \r to actual carriage returns
    .replace(/\\r/g, '\r')
    // Convert \t to actual tabs
    .replace(/\\t/g, '\t')
    // Fix escaped quotes
    .replace(/\\"/g, '"')
    // Fix escaped backslashes
    .replace(/\\\\/g, '\\');
  
  // Convert plain text with line breaks to proper HTML structure
  if (!processed.includes('<h2>') && !processed.includes('<p>')) {
    // Split by double line breaks to create paragraphs
    const paragraphs = processed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let htmlContent = '';
    
    for (let i = 0; i < paragraphs.length; i++) {
      let paragraph = paragraphs[i].trim();
      
      // Handle single line breaks within paragraphs (convert to spaces)
      paragraph = paragraph.replace(/\n(?!\n)/g, ' ');
      
      // Check if this looks like a heading
      if (paragraph.length < 100 && !paragraph.includes('.') && 
          (paragraph.includes('Understanding') || paragraph.includes('Essential') || 
           paragraph.includes('Step-by-Step') || paragraph.includes('Safety') || 
           paragraph.includes('Pro Tips') || paragraph.includes('Conclusion') ||
           paragraph.includes('What You Need') || paragraph.includes('Why This') ||
           paragraph.includes('Pre-Trip') || paragraph.includes('Physical') ||
           paragraph.includes('Getting Started') || paragraph.includes('Advanced') ||
           paragraph.includes('Risk Assessment') || paragraph.includes('Emergency') ||
           paragraph.includes('Insider') || paragraph.includes('Common Pitfalls'))) {
        
        // Determine heading level
        const isH2 = paragraph.includes('Understanding') || paragraph.includes('Essential') || 
                     paragraph.includes('Step-by-Step') || paragraph.includes('Safety') || 
                     paragraph.includes('Pro Tips') || paragraph.includes('Conclusion');
        
        const level = isH2 ? 2 : 3;
        const id = paragraph.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        htmlContent += `<h${level} id="${id}">${paragraph}</h${level}>\n\n`;
      } else {
        // Check if this looks like a list
        if (paragraph.includes('\n') && (paragraph.includes('•') || paragraph.includes('-') || /^\d+\./.test(paragraph))) {
          const lines = paragraph.split('\n').filter(line => line.trim());
          const isNumbered = /^\d+\./.test(lines[0]);
          const listTag = isNumbered ? 'ol' : 'ul';
          
          htmlContent += `<${listTag} class="space-y-2 ml-6">\n`;
          lines.forEach(line => {
            const cleanLine = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
            if (cleanLine) {
              htmlContent += `<li>${cleanLine}</li>\n`;
            }
          });
          htmlContent += `</${listTag}>\n\n`;
        } else {
          // Regular paragraph
          htmlContent += `<p>${paragraph}</p>\n\n`;
        }
      }
    }
    
    processed = htmlContent.trim();
  }
  
  // Ensure proper spacing and structure with enhanced typography
  processed = processed
    // Add proper spacing around headings with extra breathing room
    .replace(/(<h[1-6][^>]*>)/g, '\n\n\n$1')
    .replace(/(<\/h[1-6]>)/g, '$1\n\n\n')
    // Add proper spacing around paragraphs
    .replace(/(<p>)/g, '\n$1')
    .replace(/(<\/p>)/g, '$1\n\n')
    // Add proper spacing around lists
    .replace(/(<[uo]l[^>]*>)/g, '\n\n$1')
    .replace(/(<\/[uo]l>)/g, '$1\n\n')
    // Add spacing around blockquotes
    .replace(/(<blockquote[^>]*>)/g, '\n\n$1')
    .replace(/(<\/blockquote>)/g, '$1\n\n')
    // Enhance headings with bold styling and better spacing
    .replace(/<h1>/g, '<h1 class="font-black text-4xl mb-8 mt-12 leading-tight">')
    .replace(/<h2>/g, '<h2 class="font-black text-3xl mb-6 mt-10 leading-tight">')
    .replace(/<h3>/g, '<h3 class="font-bold text-2xl mb-5 mt-8 leading-tight">')
    .replace(/<h4>/g, '<h4 class="font-bold text-xl mb-4 mt-6">')
    .replace(/<h5>/g, '<h5 class="font-bold text-lg mb-3 mt-5">')
    .replace(/<h6>/g, '<h6 class="font-bold text-base mb-2 mt-4">')
    // Enhance paragraphs with better spacing and readability
    .replace(/<p>(?!.*class=)/g, '<p class="leading-relaxed mb-6 text-lg">')
    // Enhance lists with better spacing
    .replace(/<ul>/g, '<ul class="space-y-3 ml-6 my-6">')
    .replace(/<ol>/g, '<ol class="space-y-3 ml-6 my-6">')
    // Enhance blockquotes
    .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-primary pl-6 italic bg-muted/20 p-6 rounded-r-lg my-8 text-lg font-medium">')
    // Clean up multiple newlines
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  
  return processed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, category, tone = 'professional', length = 'medium' } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ 
        error: 'AI generation is not configured. Please set up GOOGLE_GENERATIVE_AI_API_KEY.' 
      }, { status: 500 });
    }

    // Get the Gemini model (using available model)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create prompt based on parameters
    const prompt = `Create a comprehensive, visually engaging blog post about "${topic}" for a trekking website with rich formatting and clear visual hierarchy.

Requirements:
- Category: ${category || 'Trekking Guide'}
- Tone: ${tone}
- Length: ${length === 'short' ? '500-800 words' : length === 'long' ? '1500-2000 words' : '1000-1200 words'}
- Create engaging, scannable content with visual breaks
- Use varied formatting for visual interest
- Include practical tips and real-world examples
- Add compelling calls-to-action and highlights

CONTENT STRUCTURE - MUST FOLLOW EXACTLY:

1. INTRODUCTION (2 paragraphs):
   - Hook paragraph with engaging opening
   - Overview paragraph explaining what readers will learn

2. H2: Understanding ${topic} - The Fundamentals
   - H3: What You Need to Know
   - H3: Why This Matters
   - Include 2-3 paragraphs per H3 section

3. H2: Essential Preparation and Planning
   - H3: Pre-Trip Checklist
   - H3: Physical and Mental Preparation
   - Include practical lists and actionable steps

4. H2: Step-by-Step Guide and Best Practices
   - H3: Getting Started
   - H3: Advanced Techniques
   - Include numbered lists and detailed instructions

5. H2: Safety First - Critical Considerations
   - H3: Risk Assessment and Management
   - H3: Emergency Preparedness
   - Include warning callouts and safety tips

6. H2: Pro Tips from Expert Guides
   - H3: Insider Secrets
   - H3: Common Pitfalls to Avoid
   - Include expert quotes and real examples

7. H2: Conclusion and Next Steps
   - Summary of key points
   - Call-to-action for readers

FORMATTING REQUIREMENTS:
- Use <strong> for important terms and emphasis
- Use <em> for subtle emphasis and quotes
- Create <ul> lists for tips and benefits
- Create <ol> lists for step-by-step processes
- Add <blockquote> for expert tips or important notes
- Use varied paragraph lengths (some short, some longer)
- Include specific numbers, statistics, and concrete examples
- Add transitional phrases between sections

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no additional text, explanations, or markdown
- Do NOT use markdown code blocks
- Escape all quotes in content using \"
- Format content as proper HTML with <p>, <h2>, <h3>, <ul>, <ol>, <li> tags
- Do NOT use literal \\n characters - use proper HTML paragraph breaks instead
- Use <p> tags for paragraphs, not \\n\\n
- Use proper HTML list formatting with <ul><li> or <ol><li>
- Ensure all JSON properties end with commas except the last one
- Test your JSON is valid before responding

Respond with this exact JSON structure:
{
  "title": "Blog title",
  "slug": "url-friendly-slug",
  "summary": "Brief summary",
  "content": "Full blog content with proper HTML formatting and clear paragraph divisions",
  "category": "${category || 'Trekking Guide'}",
  "read_time": "X min read",
  "author": "Expert Guide Team",
  "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop"
}`;

    // Generate content using the correct SDK
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();
    console.log('Raw AI response:', aiResponse);
    
    // Try to parse JSON response with enhanced cleaning
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Remove any text before the first { and after the last }
      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
      }
      
      // Fix common JSON issues
      cleanResponse = cleanResponse
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix missing commas between properties
        .replace(/}(\s*)"([^"]+)":/g, '},$1"$2":');
      
      console.log('Cleaned response:', cleanResponse.substring(0, 500) + '...');
      
      const blogData = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!blogData.title || !blogData.content) {
        console.error('Missing required fields in AI response:', blogData);
        throw new Error('Invalid AI response format - missing title or content');
      }

      // Generate slug if not provided
      if (!blogData.slug) {
        blogData.slug = blogData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }

      // Process and clean the content with enhanced formatting
      console.log('Original content preview:', blogData.content.substring(0, 200) + '...');
      
      // Aggressive cleanup for literal \n sequences
      if (blogData.content.includes('\\n')) {
        console.log('Detected literal \\n sequences, applying aggressive processing...');
        blogData.content = blogData.content
          // Replace literal \n\n with proper paragraph breaks
          .replace(/\\n\\n/g, '\n\n')
          // Replace single literal \n with spaces (for line breaks within paragraphs)
          .replace(/\\n/g, ' ')
          // Clean up any remaining escaped characters
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      
      blogData.content = processContentFormatting(blogData.content);
      
      console.log('Processed content preview:', blogData.content.substring(0, 200) + '...');

      return NextResponse.json({ blog: blogData });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response that failed to parse:', aiResponse.substring(0, 1000) + '...');
      
      // Fallback: Try to extract content manually and create structured blog
      try {
        console.log('Attempting fallback content extraction...');
        
        // Try to extract title, summary, and content from the raw response
        const fallbackBlog = extractContentFromRawResponse(aiResponse, topic, category || 'Trekking Guide');
        
        if (fallbackBlog) {
          console.log('Successfully created fallback blog structure');
          return NextResponse.json({ blog: fallbackBlog });
        }
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
      }
      
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      return NextResponse.json({ 
        error: `Failed to parse AI response: ${errorMessage}. Please try again with a different topic or settings.` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('INVALID_API_KEY')) {
        return NextResponse.json({ 
          error: 'AI service is currently unavailable. Please check API key configuration.' 
        }, { status: 503 });
      }
      if (error.message.includes('SAFETY') || error.message.includes('BLOCKED')) {
        return NextResponse.json({ 
          error: 'Content was blocked by safety filters. Please try a different topic.' 
        }, { status: 400 });
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json({ 
          error: 'AI service quota exceeded. Please try again later.' 
        }, { status: 429 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate blog content. Please try again.' 
    }, { status: 500 });
  }
} 