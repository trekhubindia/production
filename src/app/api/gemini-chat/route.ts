import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with the new API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY as string);

// Using Node.js runtime for compatibility with ISR
// Edge runtime disabled to allow static generation on pages

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ message: 'You must be logged in to use the chatbot.' }, { status: 401 });
    }

    // Get session data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ message: 'You must be logged in to use the chatbot.' }, { status: 401 });
    }

    const userId = session.user_id;

    // Get request body
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch the user's chat history
    const { data: chatHistory } = await supabaseAdmin
      .from('chat_histories')
      .select('messages')
      .eq('user_id', userId)
      .single();

    // Prepare conversation history
    let conversationHistory = [];
    if (chatHistory?.messages) {
      conversationHistory = chatHistory.messages.slice(-10); // Keep last 10 messages for context
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create system prompt
    const systemPrompt = `You are a helpful trekking assistant for Trek Hub India, a Himalayan trekking website. You help users with:

1. Trek Information: Provide details about treks, routes, difficulty levels, best seasons, and locations
2. Booking Assistance: Help with booking processes, cancellation policies, and payment queries  
3. Travel Planning: Suggest gear, safety tips, weather information, and travel logistics
4. Account Support: Help with account management, booking history, and payment issues

Key guidelines:
- Be friendly, helpful, and informative
- Provide specific, actionable advice
- If you don't know something, suggest contacting customer support
- Keep responses concise but comprehensive
- Use emojis sparingly to make responses engaging
- Always prioritize safety and responsible trekking practices
- Focus on Himalayan treks in India, Nepal, and surrounding regions`;

    // Prepare conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nConversation history:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    // Generate content using the new SDK
    const result = await model.generateContent(`${systemPrompt}${conversationContext}\n\nUser: ${message}`);
    const response = await result.response;
    const aiResponse = response.text();

    // Prepare messages for storage
    const newMessages = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ];

    // Store the updated conversation
    if (chatHistory) {
      // Update existing chat history
      await supabaseAdmin.from('chat_histories').update({ messages: newMessages }).eq('user_id', userId);
    } else {
      // Create new chat history
      await supabaseAdmin.from('chat_histories').insert({ user_id: userId, messages: newMessages });
    }

    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini chat error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('INVALID_API_KEY')) {
        return NextResponse.json({ 
          error: 'AI service is currently unavailable. Please try again later.' 
        }, { status: 503 });
      }
      if (error.message.includes('SAFETY') || error.message.includes('BLOCKED')) {
        return NextResponse.json({ 
          error: 'Your message was blocked by safety filters. Please rephrase your question.' 
        }, { status: 400 });
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json({ 
          error: 'AI service quota exceeded. Please try again later.' 
        }, { status: 429 });
      }
    }

    return NextResponse.json({ 
      error: 'An error occurred while processing your request. Please try again.' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ message: 'You must be logged in to use the chatbot.' }, { status: 401 });
    }

    // Get session data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ message: 'You must be logged in to use the chatbot.' }, { status: 401 });
    }

    const userId = session.user_id;

    // Fetch the user's chat history
    const { data: chatHistory } = await supabaseAdmin
      .from('chat_histories')
      .select('messages')
      .eq('user_id', userId)
      .single();

    // Upsert the chat history row
    if (chatHistory) {
      const { error: updateError } = await supabaseAdmin
        .from('chat_histories')
        .update({ messages: chatHistory.messages })
        .eq('user_id', userId);

      if (updateError) {
        console.log('Failed to update chat history:', updateError);
        return NextResponse.json({ message: 'Failed to update chat history.' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('chat_histories')
        .insert({ user_id: userId, messages: [] });

      if (insertError) {
        console.log('Failed to create chat history:', insertError);
        return NextResponse.json({ message: 'Failed to create chat history.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Chat history retrieved successfully',
      messages: chatHistory?.messages || []
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while retrieving chat history.' 
    }, { status: 500 });
  }
} 