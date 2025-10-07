const fs = require('fs');
const path = require('path');

// Read the treks.json file
const treksPath = path.join(__dirname, '../data/treks.json');
const treksData = JSON.parse(fs.readFileSync(treksPath, 'utf8'));

// Template for comprehensive trekEssentials based on existing complete examples
const createTrekEssentials = (existingPackingList = null) => {
  const baseEssentials = {
    clothing: [
      "Thermal innerwear (2-3 sets)",
      "Trekking pants (2-3 pairs)",
      "Fleece jacket",
      "Down jacket",
      "Rain jacket and pants",
      "Woolen cap and gloves",
      "Trekking shirts (3-4)",
      "Quick-dry underwear"
    ],
    footwear: [
      "Trekking shoes with good grip",
      "Woolen socks (4-5 pairs)",
      "Gaiters for snow/water crossing",
      "Camp shoes/sandals"
    ],
    accessories: [
      "Trekking pole",
      "Headlamp with extra batteries",
      "Sunglasses with UV protection",
      "Water bottle (2L)",
      "Backpack (50-60L)",
      "Personal first aid kit",
      "Sunscreen (SPF 30+)",
      "Personal toiletries"
    ],
    documents: [
      "Valid ID proof",
      "Medical certificate",
      "Travel insurance",
      "Emergency contact details"
    ]
  };

  // If there's an existing packingList, merge relevant items
  if (existingPackingList) {
    if (existingPackingList.clothing) {
      // Merge unique clothing items
      const existingClothing = existingPackingList.clothing.filter(item => 
        !baseEssentials.clothing.some(baseItem => 
          baseItem.toLowerCase().includes(item.toLowerCase().split(' ')[0])
        )
      );
      baseEssentials.clothing = [...baseEssentials.clothing, ...existingClothing];
    }
    
    if (existingPackingList.footwear) {
      const existingFootwear = existingPackingList.footwear.filter(item => 
        !baseEssentials.footwear.some(baseItem => 
          baseItem.toLowerCase().includes(item.toLowerCase().split(' ')[0])
        )
      );
      baseEssentials.footwear = [...baseEssentials.footwear, ...existingFootwear];
    }
    
    if (existingPackingList.accessories || existingPackingList.equipment) {
      const existingAccessories = (existingPackingList.accessories || existingPackingList.equipment || []).filter(item => 
        !baseEssentials.accessories.some(baseItem => 
          baseItem.toLowerCase().includes(item.toLowerCase().split(' ')[0])
        )
      );
      baseEssentials.accessories = [...baseEssentials.accessories, ...existingAccessories];
    }
  }

  return baseEssentials;
};

// Function to enhance itinerary if it's too basic
const enhanceItinerary = (existingItinerary, trekName, duration) => {
  if (!existingItinerary || existingItinerary.length < 3) {
    // Create a basic itinerary template
    const days = parseInt(duration.match(/\d+/)?.[0]) || 5;
    const basicItinerary = [];
    
    for (let i = 1; i <= days; i++) {
      if (i === 1) {
        basicItinerary.push({
          day_number: i,
          title: "Arrival and Base Camp",
          altitude: "Base altitude",
          distance: "N/A",
          description: "Arrive at base camp, meet your trek leader and team. Briefing about the trek and equipment check."
        });
      } else if (i === days) {
        basicItinerary.push({
          day_number: i,
          title: "Return Journey",
          altitude: "Base altitude",
          distance: "Descent",
          description: "Complete the trek and return to base. Trip concludes with farewell."
        });
      } else {
        basicItinerary.push({
          day_number: i,
          title: `Trek Day ${i-1}`,
          altitude: "Varies",
          distance: "6-8 km",
          description: `Continue trekking through beautiful landscapes with stunning mountain views. Camp overnight.`
        });
      }
    }
    return basicItinerary;
  }
  
  // Enhance existing itinerary if it lacks detail
  return existingItinerary.map(day => ({
    day_number: day.day_number || day.day,
    title: day.title || `Day ${day.day_number || day.day}`,
    altitude: day.altitude || "Varies",
    distance: day.distance || "6-8 km",
    description: day.description || "Trekking day with beautiful mountain scenery."
  }));
};

// Function to enhance basic sections
const enhanceBasicSections = (trek) => {
  const enhanced = { ...trek };
  
  // Enhance whoCanParticipate if too generic
  if (enhanced.whoCanParticipate && enhanced.whoCanParticipate.includes("Detailed travel instructions will be provided")) {
    const difficulty = trek.difficulty?.toLowerCase() || 'moderate';
    if (difficulty.includes('easy') || difficulty.includes('beginner')) {
      enhanced.whoCanParticipate = "This trek is suitable for beginners with basic fitness levels. Participants should be able to walk 4-6 hours daily with a backpack. No prior trekking experience required, but basic physical fitness is recommended.";
    } else if (difficulty.includes('difficult') || difficulty.includes('challenging')) {
      enhanced.whoCanParticipate = "This trek is suitable for experienced trekkers with excellent fitness levels. Participants should be able to walk 6-8 hours daily with a heavy backpack. Prior high-altitude trekking experience is strongly recommended.";
    } else {
      enhanced.whoCanParticipate = "This trek is suitable for intermediate trekkers with good fitness levels. Participants should be able to walk 5-7 hours daily with a backpack. Some prior trekking experience is recommended.";
    }
  }
  
  // Enhance howToReach if too generic
  if (enhanced.howToReach && enhanced.howToReach.includes("Detailed travel instructions will be provided")) {
    const region = trek.region?.toLowerCase() || '';
    if (region.includes('uttarakhand')) {
      enhanced.howToReach = "The trek typically starts from a base town in Uttarakhand. You can reach the starting point by road from Delhi/Dehradun or by air to Jolly Grant Airport, Dehradun, followed by a road journey. Detailed travel instructions will be provided upon booking.";
    } else if (region.includes('himachal')) {
      enhanced.howToReach = "The trek starts from a base town in Himachal Pradesh. You can reach the starting point by road from Delhi/Chandigarh or by air to nearest airport followed by road journey. Detailed travel instructions will be provided upon booking.";
    } else if (region.includes('nepal')) {
      enhanced.howToReach = "The trek starts from Nepal. You can reach Kathmandu by air and then travel to the trek starting point by road or domestic flight. All necessary permits and travel arrangements will be coordinated. Detailed travel instructions will be provided upon booking.";
    } else {
      enhanced.howToReach = "The trek starts from the designated base camp. Transportation can be arranged from major cities by road or air. Detailed travel instructions including pickup points and timings will be provided upon booking.";
    }
  }
  
  return enhanced;
};

let updatedCount = 0;
let convertedPackingList = 0;
let addedMissingEssentials = 0;

// Process each trek
treksData.treks = treksData.treks.map(trek => {
  let updated = false;
  const enhanced = enhanceBasicSections(trek);
  
  // Check if trek has packingList but no trekEssentials
  if (enhanced.packingList && !enhanced.sections?.trekEssentials) {
    // Convert packingList to trekEssentials
    if (!enhanced.sections) enhanced.sections = {};
    enhanced.sections.trekEssentials = createTrekEssentials(enhanced.packingList);
    delete enhanced.packingList; // Remove the old packingList
    convertedPackingList++;
    updated = true;
  }
  
  // Check if trek has neither packingList nor trekEssentials
  if (!enhanced.packingList && !enhanced.sections?.trekEssentials) {
    if (!enhanced.sections) enhanced.sections = {};
    enhanced.sections.trekEssentials = createTrekEssentials();
    addedMissingEssentials++;
    updated = true;
  }
  
  // Enhance itinerary if needed
  if (enhanced.sections?.itinerary) {
    const enhancedItinerary = enhanceItinerary(enhanced.sections.itinerary, enhanced.name, enhanced.duration);
    if (JSON.stringify(enhancedItinerary) !== JSON.stringify(enhanced.sections.itinerary)) {
      enhanced.sections.itinerary = enhancedItinerary;
      updated = true;
    }
  } else if (enhanced.itinerary) {
    const enhancedItinerary = enhanceItinerary(enhanced.itinerary, enhanced.name, enhanced.duration);
    if (JSON.stringify(enhancedItinerary) !== JSON.stringify(enhanced.itinerary)) {
      enhanced.itinerary = enhancedItinerary;
      updated = true;
    }
  }
  
  if (updated) updatedCount++;
  return enhanced;
});

// Write the updated data back to the file
fs.writeFileSync(treksPath, JSON.stringify(treksData, null, 2));

console.log(`✅ Trek essentials update completed!`);
console.log(`📊 Summary:`);
console.log(`   • Total treks processed: ${treksData.treks.length}`);
console.log(`   • Treks updated: ${updatedCount}`);
console.log(`   • Converted packingList to trekEssentials: ${convertedPackingList}`);
console.log(`   • Added missing trekEssentials: ${addedMissingEssentials}`);
console.log(`   • All treks now have comprehensive trekEssentials sections!`);
