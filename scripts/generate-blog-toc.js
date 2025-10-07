const { createClient } = require('@supabase/supabase-js');
const { JSDOM } = require('jsdom');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateTableOfContents(htmlContent) {
  if (!htmlContent) return [];

  try {
    // Create a DOM from the HTML content
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Find all heading elements
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocItems = [];

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

function addIdsToContent(htmlContent, tocItems) {
  if (!htmlContent || tocItems.length === 0) return htmlContent;

  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading, index) => {
      if (tocItems[index]) {
        heading.id = tocItems[index].id;
        // Add scroll margin for better navigation
        heading.style.scrollMarginTop = '100px';
      }
    });

    return dom.serialize();
  } catch (error) {
    console.error('Error adding IDs to content:', error);
    return htmlContent;
  }
}

async function generateTOCForExistingBlogs() {
  try {
    console.log('🔍 Fetching existing blogs...');
    
    // Fetch all blogs that don't have table_of_contents yet
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('id, title, content, table_of_contents')
      .or('table_of_contents.is.null,table_of_contents.eq.""');

    if (error) {
      console.error('Error fetching blogs:', error);
      return;
    }

    if (!blogs || blogs.length === 0) {
      console.log('✅ No blogs found or all blogs already have TOC generated');
      return;
    }

    console.log(`📝 Found ${blogs.length} blogs that need TOC generation`);

    let updated = 0;
    let failed = 0;

    for (const blog of blogs) {
      try {
        console.log(`\n🔄 Processing: ${blog.title}`);
        
        if (!blog.content) {
          console.log('⚠️  No content found, skipping...');
          continue;
        }

        // Generate TOC from content
        const tocItems = generateTableOfContents(blog.content);
        const contentWithIds = addIdsToContent(blog.content, tocItems);

        if (tocItems.length === 0) {
          console.log('📄 No headings found in content');
        } else {
          console.log(`📋 Generated TOC with ${tocItems.length} items`);
        }

        // Update the blog with TOC and updated content
        const { error: updateError } = await supabase
          .from('blogs')
          .update({
            content: contentWithIds,
            table_of_contents: JSON.stringify(tocItems),
            updated_at: new Date().toISOString()
          })
          .eq('id', blog.id);

        if (updateError) {
          console.error(`❌ Failed to update blog ${blog.title}:`, updateError);
          failed++;
        } else {
          console.log('✅ Updated successfully');
          updated++;
        }

      } catch (error) {
        console.error(`❌ Error processing blog ${blog.title}:`, error);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully updated: ${updated} blogs`);
    console.log(`❌ Failed: ${failed} blogs`);
    console.log(`📝 Total processed: ${blogs.length} blogs`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createSampleBlog() {
  try {
    console.log('📝 Creating a sample blog for testing...');
    
    const sampleContent = `
      <h1>Introduction to Himalayan Trekking</h1>
      <p>Welcome to the world of Himalayan trekking, where adventure meets spirituality.</p>
      
      <h2>Planning Your Trek</h2>
      <p>Proper planning is essential for a successful trek.</p>
      
      <h3>Choosing the Right Season</h3>
      <p>The best time for trekking depends on your destination.</p>
      
      <h3>Essential Gear</h3>
      <p>Having the right equipment can make or break your trek.</p>
      
      <h2>Popular Trek Routes</h2>
      <p>Explore some of the most popular trekking routes in the Himalayas.</p>
      
      <h3>Everest Base Camp</h3>
      <p>The most famous trek in the world.</p>
      
      <h3>Annapurna Circuit</h3>
      <p>A classic circuit trek with diverse landscapes.</p>
      
      <h2>Safety Considerations</h2>
      <p>Safety should always be your top priority.</p>
      
      <h3>Altitude Sickness</h3>
      <p>Understanding and preventing altitude sickness.</p>
      
      <h3>Weather Conditions</h3>
      <p>How to prepare for changing weather conditions.</p>
      
      <h2>Conclusion</h2>
      <p>Himalayan trekking offers unforgettable experiences for those who are well-prepared.</p>
    `;

    const { data: existingBlog } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', 'himalayan-trekking-guide')
      .single();

    if (existingBlog) {
      console.log('✅ Sample blog already exists');
      return;
    }

    const { data: blog, error } = await supabase
      .from('blogs')
      .insert({
        title: 'Ultimate Guide to Himalayan Trekking',
        slug: 'himalayan-trekking-guide',
        summary: 'A comprehensive guide to planning and executing successful Himalayan treks, covering everything from gear selection to safety considerations.',
        content: sampleContent,
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop',
        author: 'Expert Guide Team',
        category: 'Trekking Guide',
        read_time: '8 min read',
        status: 'published'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sample blog:', error);
    } else {
      console.log('✅ Sample blog created successfully');
      console.log(`📝 Blog ID: ${blog.id}`);
    }

  } catch (error) {
    console.error('Error creating sample blog:', error);
  }
}

async function main() {
  console.log('🚀 Starting TOC generation for blogs...\n');
  
  // First, create a sample blog if none exist
  await createSampleBlog();
  
  // Then generate TOC for all blogs
  await generateTOCForExistingBlogs();
  
  console.log('\n✅ TOC generation complete!');
}

main().catch(console.error);
