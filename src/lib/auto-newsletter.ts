import { supabaseAdmin } from '@/lib/supabase';
import { sendBlogNotificationEmail } from '@/lib/email-newsletter';

interface BlogData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
}

interface AutoNewsletterResult {
  success: boolean;
  message: string;
  sent?: number;
  failed?: number;
  error?: string;
}

/**
 * Automatically sends newsletter to all subscribers when a blog is published
 */
export async function sendAutomaticNewsletter(blog: BlogData): Promise<AutoNewsletterResult> {
  try {
    // Only send newsletter for published blogs
    if (blog.status !== 'published') {
      return {
        success: false,
        message: 'Newsletter not sent - blog is not published'
      };
    }

    console.log(`📧 Sending automatic newsletter for blog: ${blog.title}`);

    // Check if newsletter was already sent for this blog
    const { data: existingLog, error: logCheckError } = await supabaseAdmin
      .from('newsletter_logs')
      .select('id')
      .eq('blog_id', blog.id)
      .single();

    if (logCheckError && logCheckError.code !== 'PGRST116') {
      console.error('Error checking newsletter log:', logCheckError);
      return {
        success: false,
        message: 'Failed to check newsletter status',
        error: logCheckError.message
      };
    }

    if (existingLog) {
      console.log(`⚠️  Newsletter already sent for blog: ${blog.title}`);
      return {
        success: false,
        message: 'Newsletter already sent for this blog'
      };
    }

    // Get all active subscribers
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from('blog_subscribers')
      .select('email, name')
      .eq('status', 'active')
      .eq('verified', true);

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      return {
        success: false,
        message: 'Failed to fetch subscribers',
        error: subscribersError.message
      };
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('📭 No active subscribers found');
      return {
        success: true,
        message: 'No active subscribers to send to',
        sent: 0,
        failed: 0
      };
    }

    const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blogs/${blog.slug}`;
    
    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    console.log(`📬 Sending newsletter to ${subscribers.length} subscribers...`);

    // Send emails to all subscribers with rate limiting
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        
        const result = await sendBlogNotificationEmail({
          to: subscriber.email,
          name: subscriber.name,
          blogTitle: blog.title,
          blogSummary: blog.summary,
          blogUrl,
          unsubscribeUrl
        });

        if (result.success) {
          sentCount++;
          console.log(`✅ Sent to ${subscriber.email}`);
        } else {
          failedCount++;
          failedEmails.push(subscriber.email);
          console.error(`❌ Failed to send to ${subscriber.email}:`, result.error);
        }

        // Add delay to avoid rate limiting (Resend allows 10 emails/second)
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (error) {
        failedCount++;
        failedEmails.push(subscriber.email);
        console.error(`❌ Error sending to ${subscriber.email}:`, error);
      }
    }

    // Log the newsletter send event
    try {
      await supabaseAdmin
        .from('newsletter_logs')
        .insert({
          blog_id: blog.id,
          blog_title: blog.title,
          subscribers_count: subscribers.length,
          sent_count: sentCount,
          failed_count: failedCount,
          failed_emails: failedEmails,
          sent_at: new Date().toISOString(),
          auto_sent: true // Mark as automatically sent
        });

      console.log(`📊 Newsletter log created: ${sentCount} sent, ${failedCount} failed`);
    } catch (logError) {
      console.error('Failed to log newsletter send:', logError);
      // Don't fail the entire operation if logging fails
    }

    const message = `Newsletter sent automatically: ${sentCount}/${subscribers.length} successful`;
    console.log(`🎉 ${message}`);

    return {
      success: true,
      message,
      sent: sentCount,
      failed: failedCount
    };

  } catch (error) {
    console.error('Automatic newsletter error:', error);
    return {
      success: false,
      message: 'Failed to send automatic newsletter',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks if a blog status change should trigger newsletter sending
 */
export function shouldSendNewsletter(oldStatus: string | undefined, newStatus: string): boolean {
  // Send newsletter when:
  // 1. New blog is created with 'published' status
  // 2. Existing blog status changes from non-published to 'published'
  return newStatus === 'published' && oldStatus !== 'published';
}

/**
 * Sends newsletter in background (non-blocking)
 */
export function sendNewsletterInBackground(blog: BlogData): void {
  // Use setTimeout to make it non-blocking
  setTimeout(async () => {
    try {
      const result = await sendAutomaticNewsletter(blog);
      if (result.success) {
        console.log(`🚀 Background newsletter sent for: ${blog.title}`);
      } else {
        console.log(`⚠️  Background newsletter failed for: ${blog.title} - ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Background newsletter error for: ${blog.title}`, error);
    }
  }, 1000); // 1 second delay to ensure blog is fully created/updated
}
