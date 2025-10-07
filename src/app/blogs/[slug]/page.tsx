import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Heart, 
  Tag,
  Facebook,
  Twitter,
  Linkedin,
  Copy
} from 'lucide-react';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import StickyShareBar from '@/components/StickyShareBar';
import TableOfContents from '@/components/TableOfContents';
import BlogContent from '@/components/BlogContent';
import BlogSubscription from '@/components/BlogSubscription';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateStaticParams() {
  const { data: blogs } = await supabase
    .from('blogs')
    .select('slug')
    .eq('status', 'published');
  
  return (blogs || []).map((blog) => ({
    slug: blog.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: blog } = await supabase
    .from('blogs')
    .select('title, summary, image, author, created_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!blog) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/blogs/${slug}`;
  
  return {
    title: `${blog.title} | Trek Hub India Blog`,
    description: blog.summary || 'Read our latest trekking insights and adventures.',
    openGraph: {
      title: blog.title,
      description: blog.summary,
      url,
      images: blog.image ? [
        {
          url: blog.image,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ] : [],
      type: 'article',
      publishedTime: blog.created_at,
      authors: blog.author ? [blog.author] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.summary,
      images: blog.image ? [blog.image] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: blog, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !blog) {
    notFound();
  }

  // Fetch related articles
  const { data: relatedBlogs } = await supabase
    .from('blogs')
    .select('title, slug, summary, image, created_at, category')
    .eq('status', 'published')
    .neq('slug', slug)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <ReadingProgress />
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div className="h-full bg-black dark:bg-white transition-all duration-300" id="reading-progress"></div>
      </div>

      {/* Enhanced Back Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <div className="flex items-center gap-4">
              <Link 
                href="/blogs" 
                className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium group bg-gray-100 dark:bg-gray-900 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-4 py-2 rounded-full"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Articles
              </Link>
              
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/blogs" className="hover:text-black dark:hover:text-white transition-colors">
                  Blog
                </Link>
                <span>/</span>
                <span className="text-black dark:text-white font-medium">Article</span>
              </div>
            </div>

          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 pt-20">
        <article className="relative">
          {/* Hero Section */}
          <header className="mb-16">
            {/* Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black dark:text-white mb-8 leading-[0.9] tracking-tight">
              {blog.title}
            </h1>

            {/* Summary */}
            {blog.summary && (
              <div className="mb-10">
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-light max-w-4xl">
                  {blog.summary}
                </p>
              </div>
            )}

            {/* Category Badge */}
            {blog.category && (
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-semibold">
                  <Tag className="w-4 h-4" />
                  {blog.category}
                </span>
              </div>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-8 text-gray-500 dark:text-gray-400 mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Written by</p>
                  <p className="font-semibold text-black dark:text-white">{blog.author || 'Expert Guide Team'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-black dark:text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                  <time dateTime={blog.created_at} className="font-semibold text-black dark:text-white">
                    {new Date(blog.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>
              {blog.read_time && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-black dark:text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reading time</p>
                    <p className="font-semibold text-black dark:text-white">{blog.read_time}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Featured Image */}
            {blog.image && (
              <div className="relative h-80 md:h-[500px] lg:h-[600px] w-full rounded-3xl overflow-hidden mb-16 group">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover w-full h-full group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            )}
          </header>


          {/* Blog Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <BlogContent content={blog.content || ''} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-32 space-y-8">
                {/* Dynamic Table of Contents */}
                <TableOfContents 
                  tableOfContents={blog.table_of_contents} 
                  content={blog.content || ''} 
                />

                {/* Author Info */}
                <div className="bg-white dark:bg-black rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-white dark:text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">{blog.author || 'Expert Guide Team'}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Trekking Expert & Adventure Writer</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      With years of experience in the Himalayas, our expert team brings you authentic insights and practical advice for your trekking adventures.
                    </p>
                  </div>
                </div>

                {/* Newsletter Signup */}
                <BlogSubscription 
                  variant="sidebar"
                  title="Stay Updated"
                  description="Get the latest trekking tips, destination guides, and adventure stories delivered to your inbox."
                />
              </div>
            </div>
          </div>

          {/* Newsletter Subscription CTA */}
          <div className="mt-20 mb-16">
            <BlogSubscription 
              title="Love This Content? Get More!"
              description="Join thousands of adventurers who get our latest trekking guides, safety tips, and exclusive destination insights delivered straight to their inbox. No spam, just pure adventure content."
            />
          </div>

          {/* Enhanced Author Section */}
          <div className="mt-20 mb-16">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-12 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-16 h-16 text-white dark:text-black" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-3xl font-bold text-black dark:text-white mb-3">
                    {blog.author || 'Expert Guide Team'}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    Himalayan Trekking Expert & Adventure Writer
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                    With over a decade of experience exploring the Himalayas, our expert team has guided thousands of adventurers through some of the world's most spectacular mountain ranges. We're passionate about sharing authentic insights, safety tips, and the transformative power of mountain adventures.
                  </p>
                  <div className="flex items-center mt-6 justify-center md:justify-start">
                    <Link 
                      href={`/blogs?author=${encodeURIComponent(blog.author || 'Expert Guide Team')}`}
                      className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      View All Posts by {blog.author || 'Expert Guide Team'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedBlogs && relatedBlogs.length > 0 && (
          <section className="mt-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-6">
                Continue Reading
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover more insights and adventures from our expert team
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedBlogs.map((relatedBlog) => (
                <Link 
                  key={relatedBlog.slug} 
                  href={`/blogs/${relatedBlog.slug}`}
                  className="group block"
                >
                  <article className="bg-white dark:bg-black rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 hover:scale-105">
                    {relatedBlog.image && (
                      <div className="relative h-56 w-full overflow-hidden">
                        <Image
                          src={relatedBlog.image}
                          alt={relatedBlog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        
                        {relatedBlog.category && (
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center gap-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-semibold">
                              <Tag className="w-3 h-3" />
                              {relatedBlog.category}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={relatedBlog.created_at}>
                          {new Date(relatedBlog.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </time>
                      </div>
                      
                      <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mb-3 line-clamp-2">
                        {relatedBlog.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                        {relatedBlog.summary}
                      </p>
                      
                      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                        Read Article
                        <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Sticky Bottom Social Share Bar */}
      <StickyShareBar blog={blog} />
    </div>
  );
} 