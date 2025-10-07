import { NextResponse } from 'next/server';
import { getTrekBySlug } from '@/lib/trek-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'adi-kailash-om-parvat-trek';
    
    const trek = await getTrekBySlug(slug);
    
    if (!trek) {
      return NextResponse.json({ 
        error: 'Trek not found', 
        slug,
        message: 'The trek was not found in the database or JSON data'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      trek: {
        slug: trek.slug,
        name: trek.name,
        price: trek.price,
        region: trek.region,
        difficulty: trek.difficulty,
        duration: trek.duration,
        rating: trek.rating,
        status: trek.status,
        featured: trek.featured,
        hasSlots: trek.slots && trek.slots.length > 0,
        slotsCount: trek.slots ? trek.slots.length : 0
      },
      debug: {
        priceType: typeof trek.price,
        priceValue: trek.price,
        hasPrice: trek.price !== null && trek.price !== undefined && trek.price > 0
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch trek data', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 