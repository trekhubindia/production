import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with the correct API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY as string);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category = 'Trekking Guide' } = body;

  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ 
        error: 'AI generation is not configured. Please set up GOOGLE_GENERATIVE_AI_API_KEY.' 
      }, { status: 500 });
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create prompt for topic suggestions
    const prompt = `Generate 8 engaging blog topic suggestions for a trekking website in the "${category}" category.

Requirements:
- Topics should be relevant to trekking, hiking, and outdoor adventures
- Make them specific and actionable
- Include a mix of beginner and advanced topics
- Focus on practical value for readers
- Keep each topic concise (5-10 words)

Categories and their focus:
- Trekking Guide: Routes, destinations, trail guides
- Health & Safety: Medical tips, emergency preparedness, safety protocols
- Planning: Trip preparation, budgeting, logistics
- Equipment: Gear reviews, packing lists, equipment guides
- Destinations: Specific locations, regional guides, seasonal recommendations

IMPORTANT: Respond with ONLY a JSON array of topic strings. No additional text or formatting.

Example format:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6", "Topic 7", "Topic 8"]`;

    // Generate content using the correct SDK
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();
    
    // Try to parse JSON response
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = aiResponse.trim();
      
      // If response starts with ```json, remove it
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }
      // If response starts with ```, remove it
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const topics = JSON.parse(cleanResponse);
      
      // Validate that we got an array of strings
      if (!Array.isArray(topics) || topics.length === 0) {
        throw new Error('Invalid response format - expected array of topics');
      }

      // Ensure all items are strings and limit to 8 topics
      const validTopics = topics
        .filter(topic => typeof topic === 'string' && topic.trim().length > 0)
        .slice(0, 8);

      if (validTopics.length === 0) {
        throw new Error('No valid topics found in response');
      }

      return NextResponse.json({ topics: validTopics });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response that failed to parse:', aiResponse);
      
      // Fallback topics based on category
      const fallbackTopics = getFallbackTopics(category);
      return NextResponse.json({ topics: fallbackTopics });
    }

  } catch (error) {
    console.error('AI topic generation error:', error);
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('INVALID_API_KEY')) {
        return NextResponse.json({ 
          error: 'AI service is currently unavailable. Please check API key configuration.' 
        }, { status: 503 });
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json({ 
          error: 'AI service quota exceeded. Please try again later.' 
        }, { status: 429 });
      }
    }
    
    // Return fallback topics on error
    const fallbackTopics = getFallbackTopics(category);
    return NextResponse.json({ topics: fallbackTopics });
  }
}

function getFallbackTopics(category: string): string[] {
  const topicsByCategory: Record<string, string[]> = {
    'Trekking Guide': [
      'Best Himalayan Treks for Beginners',
      'Monsoon Trekking Safety Guidelines',
      'High Altitude Acclimatization Tips',
      'Solo Trekking vs Group Adventures',
      'Winter Trekking Preparation Guide',
      'Photography Tips for Mountain Trails',
      'Leave No Trace Principles',
      'Navigation Skills for Trekkers'
    ],
    'Health & Safety': [
      'Altitude Sickness Prevention Methods',
      'First Aid Kit for Trekking',
      'Hydration Strategies at High Altitude',
      'Emergency Evacuation Procedures',
      'Weather Hazard Recognition',
      'Wildlife Safety in Mountains',
      'Injury Prevention on Trails',
      'Mental Health During Long Treks'
    ],
    'Planning': [
      'Budget Planning for Himalayan Treks',
      'Best Time to Visit Popular Peaks',
      'Permit Requirements for Restricted Areas',
      'Transportation to Trek Starting Points',
      'Accommodation Options During Treks',
      'Insurance Coverage for Trekking',
      'Group Size Considerations',
      'Itinerary Planning Essentials'
    ],
    'Equipment': [
      'Essential Trekking Gear Checklist',
      'Choosing the Right Trekking Boots',
      'Layering System for Mountain Weather',
      'Backpack Selection and Packing',
      'Sleeping Bag Temperature Ratings',
      'Trekking Pole Benefits and Usage',
      'Water Purification Methods',
      'Lightweight Gear for Long Treks'
    ],
    'Destinations': [
      'Hidden Gems in Uttarakhand Hills',
      'Best Treks in Himachal Pradesh',
      'Ladakh High Altitude Adventures',
      'Nepal Teahouse Trek Routes',
      'Sikkim Rhododendron Trail Guide',
      'Kashmir Valley Trekking Options',
      'Western Ghats Monsoon Treks',
      'Rajasthan Desert Hiking Trails'
    ]
  };

  return topicsByCategory[category] || topicsByCategory['Trekking Guide'];
}
