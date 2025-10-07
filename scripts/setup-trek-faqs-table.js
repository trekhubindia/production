const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTrekFAQsTable() {
  try {
    console.log('🚀 Setting up trek_faqs table...\n');

    // Check if table exists
    console.log('🔍 Checking if trek_faqs table exists...');
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'trek_faqs');

    if (checkError) {
      console.log('Creating trek_faqs table...');
    }

    // Create the trek_faqs table with all necessary columns
    console.log('📋 Creating trek_faqs table with rotation features...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS trek_faqs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        trek_slug TEXT REFERENCES treks(slug) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT,
        user_name TEXT,
        user_email TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'hidden')),
        is_featured BOOLEAN DEFAULT false,
        answered_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        answered_at TIMESTAMP WITH TIME ZONE,
        
        -- Rotation and analytics columns
        view_count INTEGER DEFAULT 0,
        last_shown_homepage TIMESTAMP WITH TIME ZONE,
        homepage_show_count INTEGER DEFAULT 0,
        priority_score DECIMAL DEFAULT 0,
        seasonal_relevance TEXT DEFAULT 'all' CHECK (seasonal_relevance IN ('spring', 'summer', 'autumn', 'winter', 'all')),
        tags TEXT[] DEFAULT ARRAY['general']
      );
    `;

    // Execute using a direct query approach
    const { error: createError } = await supabase.rpc('exec', { 
      sql: createTableSQL 
    }).catch(async () => {
      // If RPC doesn't work, try using a simple insert/update to test connection
      console.log('Trying alternative approach...');
      
      // Create table using Supabase client (this might work for simple operations)
      const { error } = await supabase
        .from('trek_faqs')
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ Table does not exist and cannot be created via client');
        console.log('📝 Please run this SQL in your Supabase dashboard:');
        console.log(createTableSQL);
        return { error: 'Manual creation required' };
      }
      
      return { error: null };
    });

    if (createError && createError !== 'Manual creation required') {
      console.log('❌ Could not create table automatically');
      console.log('📝 Please run this SQL in your Supabase dashboard SQL editor:');
      console.log('\n' + createTableSQL + '\n');
    } else if (createError === 'Manual creation required') {
      console.log('📝 Manual table creation required - see SQL above');
    } else {
      console.log('✅ trek_faqs table created successfully');
    }

    // Create indexes
    console.log('\n📊 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_status ON trek_faqs (status);',
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_trek_slug ON trek_faqs (trek_slug);',
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_is_featured ON trek_faqs (is_featured);',
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_view_count ON trek_faqs (view_count DESC);',
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_last_shown ON trek_faqs (last_shown_homepage);',
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_priority_score ON trek_faqs (priority_score DESC);',
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_seasonal ON trek_faqs (seasonal_relevance);',
      'CREATE INDEX IF NOT EXISTS idx_trek_faqs_homepage_rotation ON trek_faqs (status, is_featured, priority_score DESC, last_shown_homepage ASC);'
    ];

    console.log('📝 Please run these index creation queries in your Supabase dashboard:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index}`);
    });

    // Create helper functions
    console.log('\n⚙️ Creating helper functions...');
    
    const functions = [
      `-- Function to calculate FAQ priority score
CREATE OR REPLACE FUNCTION calculate_faq_priority_score(faq_id UUID) RETURNS DECIMAL AS $$
DECLARE
  faq_record trek_faqs%ROWTYPE;
  score DECIMAL := 0;
  days_since_shown INTEGER;
  current_season TEXT;
BEGIN
  SELECT * INTO faq_record FROM trek_faqs WHERE id = faq_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base score for featured FAQs
  IF faq_record.is_featured THEN
    score := score + 100;
  END IF;
  
  -- Add points for view count (logarithmic scale)
  score := score + (LOG(GREATEST(faq_record.view_count, 1)) * 10);
  
  -- Add points based on how long since last shown
  IF faq_record.last_shown_homepage IS NOT NULL THEN
    days_since_shown := EXTRACT(DAY FROM (NOW() - faq_record.last_shown_homepage));
    score := score + (days_since_shown * 2);
  ELSE
    score := score + 50;
  END IF;
  
  -- Seasonal relevance bonus
  current_season := CASE 
    WHEN EXTRACT(MONTH FROM NOW()) IN (3, 4, 5) THEN 'spring'
    WHEN EXTRACT(MONTH FROM NOW()) IN (6, 7, 8) THEN 'summer'
    WHEN EXTRACT(MONTH FROM NOW()) IN (9, 10, 11) THEN 'autumn'
    WHEN EXTRACT(MONTH FROM NOW()) IN (12, 1, 2) THEN 'winter'
  END;
  
  IF faq_record.seasonal_relevance = current_season OR faq_record.seasonal_relevance = 'all' THEN
    score := score + 25;
  END IF;
  
  -- Reduce score if shown too frequently
  IF faq_record.homepage_show_count > 10 THEN
    score := score - (faq_record.homepage_show_count * 2);
  END IF;
  
  RETURN GREATEST(score, 0);
END;
$$ LANGUAGE plpgsql;`,

      `-- Function to update all FAQ priority scores
CREATE OR REPLACE FUNCTION update_all_faq_priority_scores() RETURNS INTEGER AS $$
DECLARE
  faq_record trek_faqs%ROWTYPE;
  updated_count INTEGER := 0;
BEGIN
  FOR faq_record IN 
    SELECT * FROM trek_faqs WHERE status = 'answered'
  LOOP
    UPDATE trek_faqs 
    SET priority_score = calculate_faq_priority_score(faq_record.id)
    WHERE id = faq_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;`,

      `-- Function to mark FAQs as shown on homepage
CREATE OR REPLACE FUNCTION mark_faqs_shown_on_homepage(faq_ids UUID[]) RETURNS VOID AS $$
BEGIN
  UPDATE trek_faqs 
  SET 
    last_shown_homepage = NOW(),
    homepage_show_count = homepage_show_count + 1
  WHERE id = ANY(faq_ids);
END;
$$ LANGUAGE plpgsql;`,

      `-- Function to increment FAQ view count
CREATE OR REPLACE FUNCTION increment_faq_view_count(faq_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE trek_faqs 
  SET view_count = view_count + 1
  WHERE id = faq_id;
END;
$$ LANGUAGE plpgsql;`
    ];

    console.log('\n📝 Please run these function creation queries in your Supabase dashboard:');
    functions.forEach((func, i) => {
      console.log(`\n--- Function ${i + 1} ---`);
      console.log(func);
    });

    console.log('\n🎉 Setup instructions provided!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the SQL queries above in your Supabase dashboard');
    console.log('2. Run: node scripts/populate-homepage-faqs.js');
    console.log('3. Run: node scripts/test-faq-rotation.js');
    console.log('\n💡 After setup, your homepage FAQs will rotate intelligently!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupTrekFAQsTable();
