const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTrekFAQsTable() {
  console.log('🚀 Creating trek_faqs table using API...');

  try {
    // First check if table exists by trying to query it
    const { data: existingData, error: existingError } = await supabase
      .from('trek_faqs')
      .select('id')
      .limit(1);

    if (!existingError) {
      console.log('✅ trek_faqs table already exists!');
      
      // Add some sample data
      const { data: sampleData, error: insertError } = await supabase
        .from('trek_faqs')
        .insert([
          {
            trek_slug: 'adi-kailash-om-parvat-trek',
            question: 'What is the best time to do this trek?',
            answer: 'The best time for Adi Kailash & Om Parvat Trek is from May to October when the weather is favorable and the routes are accessible.',
            user_name: 'Sample User',
            user_email: 'sample@example.com',
            status: 'answered',
            is_featured: true,
            answered_at: new Date().toISOString()
          },
          {
            trek_slug: 'adi-kailash-om-parvat-trek',
            question: 'What is the difficulty level of this trek?',
            answer: 'This is a moderate to difficult trek suitable for experienced trekkers with good physical fitness.',
            user_name: 'Trek Enthusiast',
            user_email: 'sample@example.com',
            status: 'answered',
            is_featured: false,
            answered_at: new Date().toISOString()
          }
        ])
        .select();

      if (insertError) {
        console.log('⚠️  Sample data insert failed:', insertError.message);
      } else {
        console.log('✅ Sample FAQs added successfully!');
      }

      return;
    }

    // If we get here, table doesn't exist
    console.log('📝 Table does not exist. Creating using database functions...');

    // Try using a database function to create the table
    const { data, error } = await supabase.rpc('create_trek_faqs_table');

    if (error) {
      console.log('❌ Database function not available. Using alternative method...');
      
      // Alternative: Try to create via schema manipulation
      // This won't work with regular Supabase client, so we'll provide instructions
      console.log('');
      console.log('🔧 Please create the table manually using one of these methods:');
      console.log('');
      console.log('METHOD 1: Via Supabase Dashboard Table Editor');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to "Table Editor"');
      console.log('3. Click "Create a new table"');
      console.log('4. Name: trek_faqs');
      console.log('5. Add these columns:');
      console.log('   - id (uuid, primary key, default: gen_random_uuid())');
      console.log('   - trek_slug (text, not null)');
      console.log('   - question (text, not null)');
      console.log('   - answer (text)');
      console.log('   - user_name (text)');
      console.log('   - user_email (text)');
      console.log('   - status (text, default: "pending")');
      console.log('   - is_featured (boolean, default: false)');
      console.log('   - created_at (timestamptz, default: now())');
      console.log('   - answered_at (timestamptz)');
      console.log('');
      console.log('METHOD 2: Via API (if you have admin access)');
      console.log('Run this in your browser console on the Supabase dashboard:');
      console.log(`
fetch('/rest/v1/rpc/exec', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SERVICE_ROLE_KEY',
    'apikey': 'YOUR_SERVICE_ROLE_KEY'
  },
  body: JSON.stringify({
    sql: \`CREATE TABLE trek_faqs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      trek_slug TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT,
      user_name TEXT,
      user_email TEXT,
      status TEXT DEFAULT 'pending',
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      answered_at TIMESTAMPTZ
    );\`
  })
});
      `);
      
      return;
    }

    console.log('✅ Table created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Provide a simple workaround
    console.log('');
    console.log('🔄 SIMPLE WORKAROUND:');
    console.log('Since we cannot create the table programmatically, let\'s create a minimal version:');
    console.log('');
    console.log('1. Go to Supabase Dashboard > Table Editor');
    console.log('2. Click "Create a new table"');
    console.log('3. Table name: trek_faqs');
    console.log('4. Add these essential columns:');
    console.log('   - id (uuid, primary key)');
    console.log('   - trek_slug (text)');
    console.log('   - question (text)');
    console.log('   - answer (text)');
    console.log('   - user_name (text)');
    console.log('   - status (text)');
    console.log('   - is_featured (boolean)');
    console.log('   - created_at (timestamp)');
    console.log('');
    console.log('5. After creating, run this script again to add sample data');
  }
}

createTrekFAQsTable();
