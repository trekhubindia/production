import Footer from "@/components/Footer";
import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Tag, Clock, User, ArrowRight, Calendar, BookOpen, TrendingUp, Star, Eye, Heart } from 'lucide-react';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'Blog — Trekking Stories & Insights',
  description: 'Read our latest trekking stories, adventure insights, and travel tips from the Himalayas.',
  keywords: 'trekking blog, hiking stories, adventure travel, himalayan trekking',
  openGraph: {
    title: 'Blog — Trekking Stories & Insights',
    description: 'Read our latest trekking stories and adventure insights.',
    type: 'website',
    url: 'https://trekhubindia.com/blogs',
  },
};

interface Blog {
  id: string;
  title?: string;
  slug?: string;
  image?: string;
  author?: string;
  date?: string;
  content?: string;
  created_at?: string;
  summary?: string;
  category?: string;
  read_time?: string;
  status?: string;
}

export default async function BlogsPage({
  searchParams
}: {
  searchParams: { author?: string }
}) {
  try {
    console.log('Fetching blogs from database...');
    
    // Get author filter from search params
    const authorFilter = searchParams?.author;
    
    // First, check if the blogs table exists
    const { error: tableError } = await supabase
      .from('blogs')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('Table error:', tableError);
      if (tableError.code === '42P01') {
        return (
          <div className="min-h-screen bg-background text-foreground">
            {/* Premium Hero Section */}
            <section className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="/images/valley-flowers-summer.jpg"
                  alt="Blog Hero"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-black/60" />
              </div>
              
              <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white/90">Latest Stories</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black mb-6 text-white leading-tight">
                  Trekking Stories
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
                  Discover epic adventures, expert insights, and inspiring tales from the world&apos;s most breathtaking trails.
                </p>
              </div>
            </section>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-16">
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-8 bg-green-600 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4">Blogs Coming Soon</h3>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  We&apos;re crafting amazing stories for you. Get ready for epic adventures and expert insights!
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600/20 border border-green-500/30 rounded-full text-green-600">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">Premium Content Loading</span>
                </div>
              </div>
            </main>
            <Footer />
          </div>
        );
      }
    }

    // Fetch blogs with status and author filter
    let query = supabase
      .from("blogs")
      .select("id, title, slug, summary, image, author, created_at, category, read_time, status");
    
    // Add author filter if provided
    if (authorFilter) {
      query = query.eq('author', authorFilter);
    }
    
    const { data: blogs, error } = await query.order('created_at', { ascending: false });

    console.log('Blogs fetched:', blogs?.length || 0);
    console.log('Error if any:', error);
    console.log('All blogs data:', blogs);

    if (error) {
      console.error('Error fetching blogs:', error);
      return (
        <div className="min-h-screen bg-background text-foreground">
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-16">
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Error Loading Blogs</h3>
              <p className="text-muted-foreground mb-6">We&apos;re experiencing some technical difficulties.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-600 text-sm">
                <span>Error: {error.message}</span>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    // Filter published blogs
    const publishedBlogs = blogs?.filter(blog => blog.status === 'published' || !blog.status) || [];
    console.log('Published blogs:', publishedBlogs.length);
    
    // If no published blogs, show all blogs for debugging
    const blogsToShow = publishedBlogs.length > 0 ? publishedBlogs : (blogs || []);
    console.log('Blogs to show:', blogsToShow.length);

    // Get recent posts and categories for sidebar
    // const recentPosts = publishedBlogs.slice(0, 4);
    // const categories = Array.from(new Set(publishedBlogs.map((b: Blog) => b.category).filter(Boolean)));

    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Premium Hero Section */}
        <section className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/valley-flowers-summer.jpg"
              alt="Blog Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              {authorFilter ? (
                <>
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white/90">Author Posts</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white/90">Latest Stories</span>
                </>
              )}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 text-white leading-tight">
              {authorFilter ? `Posts by ${authorFilter}` : 'Trekking Stories'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              {authorFilter 
                ? `Explore all articles and insights written by ${authorFilter}, sharing expert knowledge and adventure experiences.`
                : 'Discover epic adventures, expert insights, and inspiring tales from the world&apos;s most breathtaking trails.'
              }
            </p>
            
            {authorFilter && (
              <div className="mt-6">
                <Link 
                  href="/blogs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-white/20 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  View All Posts
                </Link>
              </div>
            )}
          </div>
        </section>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-16">
          {blogsToShow && blogsToShow.length > 0 ? (
            <div className="space-y-16">
              {/* Featured Article */}
              {blogsToShow.length > 0 && (
                <section className="mb-16">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {authorFilter ? `Latest from ${authorFilter}` : 'Featured Story'}
                    </h2>
                    <div className="w-20 h-1 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <article className="group relative bg-card rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border">
                    <div className="flex flex-col lg:flex-row min-h-[500px]">
                      {/* Image Section */}
                      <div className="lg:w-1/2 relative h-80 lg:h-auto overflow-hidden">
                        <Image
                          src={blogsToShow[0].image || '/images/valley-flowers-summer.jpg'}
                          alt={blogsToShow[0].title || ''}
                          fill
                          className="object-cover brightness-105 contrast-110 saturate-105 group-hover:brightness-110 group-hover:contrast-115 group-hover:saturate-110 group-hover:scale-110 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                        
                        {/* Floating Category Badge */}
                        {blogsToShow[0].category && (
                          <div className="absolute top-6 left-6 z-20">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-sm font-semibold border border-green-400/30 shadow-lg">
                              <Tag className="w-3 h-3" />
                              {blogsToShow[0].category}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content Section */}
                      <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <time dateTime={blogsToShow[0].created_at}>
                              {blogsToShow[0].created_at ? new Date(blogsToShow[0].created_at).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              }) : ''}
                            </time>
                          </div>
                          {blogsToShow[0].read_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{blogsToShow[0].read_time}</span>
                            </div>
                          )}
                        </div>
                        
                        <h2 className="text-4xl lg:text-5xl font-black mb-6 text-foreground group-hover:text-green-600 transition-colors duration-300 leading-tight">
                          <Link href={`/blogs/${blogsToShow[0].slug}`} className="hover:underline decoration-green-500/50 underline-offset-4">
                            {blogsToShow[0].title}
                          </Link>
                        </h2>
                        
                        <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                          {blogsToShow[0].summary}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              By {blogsToShow[0].author || 'Expert Guide Team'}
                            </span>
                          </div>
                          <Link
                            href={`/blogs/${blogsToShow[0].slug}`}
                            className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105"
                          >
                            Read Story
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                </section>
              )}

              {/* Modern Blog Grid */}
              <section>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Latest Stories</h2>
                  <div className="w-20 h-1 bg-green-500 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogsToShow.slice(1).map((blog: Blog, index: number) => (
                    <article
                      key={blog.id}
                      className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-green-500/30 hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {blog.image && (
                        <div className="relative h-56 w-full overflow-hidden">
                          <Image
                            src={blog.image}
                            alt={blog.title || ''}
                            fill
                            className="object-cover brightness-105 contrast-110 saturate-105 group-hover:brightness-110 group-hover:contrast-115 group-hover:saturate-110 group-hover:scale-110 transition-all duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                          
                          {/* Category Tag */}
                          {blog.category && (
                            <div className="absolute top-4 left-4 z-20">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold border border-green-400/30 shadow-lg">
                                {blog.category}
                              </span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                              <Eye className="w-4 h-4 text-white" />
                            </button>
                            <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                              <Heart className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <time dateTime={blog.created_at}>
                              {blog.created_at ? new Date(blog.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              }) : ''}
                            </time>
                          </div>
                          {blog.read_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{blog.read_time}</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-green-600 transition-colors duration-300 leading-tight">
                          <Link href={`/blogs/${blog.slug}`} className="hover:underline decoration-green-500/50 underline-offset-4">
                            {blog.title}
                          </Link>
                        </h3>
                        
                        <p className="text-muted-foreground mb-6 line-clamp-3 flex-1 text-sm leading-relaxed font-light">
                          {blog.summary}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {blog.author || 'Expert Guide Team'}
                            </span>
                          </div>
                          <Link
                            href={`/blogs/${blog.slug}`}
                            className="group/read inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                          >
                            Read More
                            <ArrowRight className="w-3 h-3 group-hover/read:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-8 bg-green-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">No Stories Yet</h3>
                              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  We&apos;re working on amazing content for you. Check back soon for epic trekking stories!
                </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600/20 border border-green-500/30 rounded-full text-green-600">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Premium Content Loading</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Total blogs in database: {blogs?.length || 0}</p>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Unexpected Error</h3>
            <p className="text-muted-foreground mb-6">Something went wrong. Please try again later.</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-600 text-sm">
              <span>Error: {error instanceof Error ? error.message : 'Unknown error'}</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
} 