 'use client';
 
 import Image from 'next/image';
 import Link from 'next/link';
 import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
 import { useHomepageData } from '@/hooks/useHomepageData';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  image: string;
  category?: string;
  read_time?: string;
  publishedAt: string;
  author: string;
}

export default function BlogHighlightsSection() {
  const { data, loading, error } = useHomepageData();

  if (loading) {
    return (
      <section className="blog-highlights py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Latest from Our Blog
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover trekking insights, tips, and stories from our expert team
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-xl mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="blog-highlights py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Latest from Our Blog
            </h2>
            <p className="text-red-500">Failed to load blog posts. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const blogPosts = data.blogPosts;
  
  // If no blog posts, show a placeholder or skip the section
  if (!blogPosts || blogPosts.length === 0) {
    return (
      <section className="blog-highlights py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Latest from Our Blog
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover trekking insights, tips, and stories from our expert team
            </p>
          </div>
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">Blogs Coming Soon</h3>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We&apos;re crafting amazing stories for you. Get ready for epic adventures and expert insights!
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600/20 border border-green-500/30 rounded-full text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="text-sm font-medium">Premium Content Loading</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const featuredPost = blogPosts[0];
  const otherPosts = blogPosts.slice(1, 4);

  return (
    <section className="blog-highlights py-20 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Latest from Our Blog
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover trekking insights, tips, and stories from our expert team
          </p>
        </div>

        {/* Featured Article */}
        {featuredPost && (
          <div className="mb-16">
            <article className="group relative bg-card rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border">
              <div className="flex flex-col lg:flex-row min-h-[500px]">
                {/* Image Section */}
                <div className="lg:w-1/2 relative h-80 lg:h-auto overflow-hidden">
                  <Image
                    src={featuredPost.image || '/images/valley-flowers-summer.jpg'}
                    alt={featuredPost.title}
                    fill
                    className="object-cover brightness-105 contrast-110 saturate-105 group-hover:brightness-110 group-hover:contrast-115 group-hover:saturate-110 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                  
                  {/* Floating Category Badge */}
                  {featuredPost.category && (
                    <div className="absolute top-6 left-6 z-20">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-sm font-semibold border border-green-400/30 shadow-lg">
                        {featuredPost.category}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Content Section */}
                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={featuredPost.publishedAt}>
                        {featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : ''}
                      </time>
                    </div>
                    {featuredPost.read_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{featuredPost.read_time}</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-4xl lg:text-5xl font-black mb-6 text-foreground group-hover:text-green-600 transition-colors duration-300 leading-tight">
                    <Link href={`/blogs/${featuredPost.slug}`} className="hover:underline decoration-green-500/50 underline-offset-4">
                      {featuredPost.title}
                    </Link>
                  </h3>
                  
                  <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        By {featuredPost.author || 'Expert Guide Team'}
                      </span>
                    </div>
                    <Link
                      href={`/blogs/${featuredPost.slug}`}
                      className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105"
                    >
                      Read More →
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Latest from Our Blog - Three Cards */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post: BlogPost, index: number) => (
              <article
                key={post.id}
                className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-green-500/30 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {post.image && (
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover brightness-105 contrast-110 saturate-105 group-hover:brightness-110 group-hover:contrast-115 group-hover:saturate-110 group-hover:scale-110 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                    
                    {/* Category Tag */}
                    {post.category && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold border border-green-400/30 shadow-lg">
                          {post.category}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <time dateTime={post.publishedAt}>
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : ''}
                      </time>
                    </div>
                    {post.read_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.read_time}</span>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="text-xl font-bold mb-4 text-foreground group-hover:text-green-600 transition-colors duration-300 leading-tight">
                    <Link href={`/blogs/${post.slug}`} className="hover:underline decoration-green-500/50 underline-offset-4">
                      {post.title}
                    </Link>
                  </h4>
                  
                  <p className="text-muted-foreground mb-6 line-clamp-3 flex-1 text-sm leading-relaxed font-light">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {post.author || 'Expert Guide Team'}
                      </span>
                    </div>
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="group/read inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                    >
                      Read More →
                      <ArrowRight className="w-3 h-3 group-hover/read:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 