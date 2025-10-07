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

// FAQ data from the hardcoded file with enhanced rotation data
const faqData = [
  {
    question: "What is the best time to trek in the Himalayas?",
    answer: "The best time for Himalayan trekking varies by region. Spring (March-May) offers blooming rhododendrons and moderate temperatures. Monsoon (June-August) brings lush greenery but rain. Autumn (September-November) provides clear skies and stable weather, making it ideal for most treks. Winter (December-February) is perfect for snow treks like Kedarkantha.",
    is_featured: true,
    seasonal_relevance: 'all',
    tags: ['timing', 'seasons', 'weather', 'planning'],
    view_count: Math.floor(Math.random() * 200) + 100 // Simulate existing views
  },
  {
    question: "Do I need prior trekking experience for Himalayan treks?",
    answer: "While prior experience is beneficial, we offer treks for all skill levels. Beginners can start with easy treks like Valley of Flowers or Hampta Pass. Moderate treks like Kedarkantha require basic fitness. Advanced treks like Auden's Col need significant experience. Our expert guides ensure safety regardless of experience level.",
    is_featured: true,
    seasonal_relevance: 'all',
    tags: ['experience', 'beginners', 'difficulty', 'guides'],
    view_count: Math.floor(Math.random() * 180) + 80
  },
  {
    question: "What should I pack for a Himalayan trek?",
    answer: "Essential items include: warm clothing (thermal wear, fleece, down jacket), waterproof gear, trekking shoes, sleeping bag, water bottle, first aid kit, headlamp, and personal toiletries. We provide detailed packing lists specific to each trek. Remember to pack light but include all essentials for safety and comfort.",
    is_featured: true,
    seasonal_relevance: 'all',
    tags: ['packing', 'equipment', 'gear', 'essentials'],
    view_count: Math.floor(Math.random() * 220) + 120
  },
  {
    question: "How do you ensure safety during treks?",
    answer: "Safety is our top priority. We maintain small group sizes (max 12 people), provide certified guides with first aid training, carry emergency communication devices, use quality equipment, and follow strict acclimatization protocols. All guides are experienced in mountain rescue and emergency response procedures.",
    is_featured: true,
    seasonal_relevance: 'all',
    tags: ['safety', 'guides', 'emergency', 'protocols'],
    view_count: Math.floor(Math.random() * 160) + 90
  },
  {
    question: "What is the accommodation like during treks?",
    answer: "Accommodation varies by trek. We use comfortable guesthouses in villages, well-equipped base camps, and high-quality tents for camping treks. All accommodations are carefully selected for safety, cleanliness, and comfort. We ensure proper bedding and basic amenities even in remote locations.",
    is_featured: false,
    seasonal_relevance: 'all',
    tags: ['accommodation', 'camping', 'guesthouses', 'comfort'],
    view_count: Math.floor(Math.random() * 100) + 40
  },
  {
    question: "How do you handle altitude sickness?",
    answer: "We follow strict acclimatization schedules with gradual altitude gain, rest days, and monitoring. Our guides are trained to recognize symptoms and carry necessary medications. We never rush altitude gain and always have evacuation plans. Participants receive pre-trek guidance on altitude sickness prevention.",
    is_featured: false,
    seasonal_relevance: 'all',
    tags: ['altitude', 'health', 'acclimatization', 'safety'],
    view_count: Math.floor(Math.random() * 140) + 70
  },
  {
    question: "What is included in the trek package?",
    answer: "Our packages include: all permits and fees, accommodation, meals (breakfast, lunch, dinner), expert guide services, safety equipment, transportation to/from trek start point, and basic first aid. Exclusions typically include: personal gear, travel insurance, and personal expenses. Detailed inclusions are provided for each trek.",
    is_featured: false,
    seasonal_relevance: 'all',
    tags: ['package', 'inclusions', 'pricing', 'services'],
    view_count: Math.floor(Math.random() * 110) + 50
  },
  {
    question: "Can I customize a trek itinerary?",
    answer: "Yes, we offer customized treks for groups and individuals. We can modify routes, duration, difficulty level, and add special activities like photography workshops or cultural experiences. Custom treks require advance booking and may have different pricing. Contact us to discuss your specific requirements.",
    is_featured: false,
    seasonal_relevance: 'all',
    tags: ['customization', 'groups', 'itinerary', 'planning'],
    view_count: Math.floor(Math.random() * 80) + 30
  }
];

async function populateHomepageFAQs() {
  try {
    console.log('🚀 Starting to populate homepage FAQs...');

    // Check if trek_faqs table exists
    const { data: existingFaqs, error: checkError } = await supabase
      .from('trek_faqs')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking trek_faqs table:', checkError.message);
      console.log('💡 Make sure the trek_faqs table exists in your database');
      return;
    }

    // Insert FAQs
    for (const [index, faq] of faqData.entries()) {
      console.log(`📝 Adding FAQ ${index + 1}: "${faq.question.substring(0, 50)}..."`);
      
      const { data, error } = await supabase
        .from('trek_faqs')
        .insert({
          question: faq.question,
          answer: faq.answer,
          status: 'answered', // Set as answered so they appear on homepage
          is_featured: faq.is_featured,
          user_name: 'System',
          answered_by: 'Admin Team',
          answered_at: new Date().toISOString(),
          trek_slug: null, // General FAQs not specific to any trek
          view_count: faq.view_count || 0,
          seasonal_relevance: faq.seasonal_relevance || 'all',
          tags: faq.tags || ['general']
        })
        .select();

      if (error) {
        console.error(`❌ Error inserting FAQ ${index + 1}:`, error.message);
      } else {
        console.log(`✅ Successfully added FAQ ${index + 1}`);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verify the results
    const { data: allFaqs, error: countError } = await supabase
      .from('trek_faqs')
      .select('id, question, status, is_featured')
      .eq('status', 'answered');

    if (countError) {
      console.error('❌ Error counting FAQs:', countError.message);
    } else {
      const featuredCount = allFaqs.filter(faq => faq.is_featured).length;
      console.log(`\n📊 Summary:`);
      console.log(`✅ Total answered FAQs: ${allFaqs.length}`);
      console.log(`⭐ Featured FAQs: ${featuredCount}`);
      console.log(`📝 Regular FAQs: ${allFaqs.length - featuredCount}`);
    }

    console.log('\n🎉 Homepage FAQs population completed successfully!');
    console.log('💡 The homepage will now show dynamic FAQs from the database');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the population
populateHomepageFAQs();
