const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncJsonWithDatabaseImages() {
  try {
    console.log('🔄 Syncing JSON file with database images...\n');
    
    // Read the current JSON file
    const jsonPath = path.join(__dirname, '../data/treks.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Get all trek images from database
    const { data: dbTreks, error } = await supabase
      .from('treks')
      .select('slug, image')
      .eq('status', true);
    
    if (error) {
      console.error('❌ Error fetching treks from database:', error);
      return;
    }
    
    console.log(`📊 Found ${dbTreks.length} treks in database`);
    console.log(`📊 Found ${jsonData.treks.length} treks in JSON file\n`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Create a map of database images by slug
    const dbImageMap = new Map();
    dbTreks.forEach(trek => {
      dbImageMap.set(trek.slug, trek.image);
    });
    
    // Update JSON data with database images
    jsonData.treks = jsonData.treks.map(trek => {
      const dbImage = dbImageMap.get(trek.slug);
      
      if (dbImage && dbImage !== trek.image) {
        console.log(`🔄 Updating ${trek.name}:`);
        console.log(`   Old: ${trek.image}`);
        console.log(`   New: ${dbImage}`);
        updatedCount++;
        
        return {
          ...trek,
          image: dbImage
        };
      } else if (!dbImage) {
        console.log(`⚠️  No database image found for: ${trek.name} (${trek.slug})`);
        notFoundCount++;
      }
      
      return trek;
    });
    
    // Write updated JSON back to file
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    
    console.log('\n🎉 JSON sync completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Updated images: ${updatedCount}`);
    console.log(`   ⚠️  Not found in DB: ${notFoundCount}`);
    console.log(`   📄 JSON file updated: ${jsonPath}`);
    
    if (updatedCount > 0) {
      console.log('\n🌐 JSON file now matches database images!');
      console.log('🔗 Trek cards will display the new Unsplash images.');
    }
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
  }
}

// Run the script
if (require.main === module) {
  syncJsonWithDatabaseImages()
    .then(() => {
      console.log('\n✨ Sync completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncJsonWithDatabaseImages };
