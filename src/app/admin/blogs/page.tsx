'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/context/AuthContext';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calendar,
  User,
  Tag,
  Clock,
  Search,
  Copy,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Globe,
  Zap,
  Mail,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Blog {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  image?: string;
  author?: string;
  category?: string;
  read_time?: string;
  status: string;
  created_at: string;
}

export default function AdminBlogsPage() {
  const { user, initialized } = useAuth();
  const [activeTab, setActiveTab] = useState<'manage' | 'generate'>('manage');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    image: '',
    author: '',
    category: '',
    read_time: '',
    status: 'draft'
  });

  const [aiFormData, setAiFormData] = useState({
    topic: '',
    category: 'Trekking Guide',
    tone: 'professional',
    length: 'medium'
  });
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (initialized && user) {
      fetchBlogs();
    }
  }, [initialized, user]);

  // Auto-load topic suggestions when category changes or Generate tab is opened
  useEffect(() => {
    if (activeTab === 'generate' && aiFormData.category) {
      generateTopicSuggestions();
    }
  }, [aiFormData.category, activeTab]);

  if (initialized && (!user || (user.role !== 'admin' && user.role !== 'owner'))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-8"
        >
          <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-xl text-muted-foreground">Only administrators can access this area</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/admin/blogs');
      const data = await response.json();
      if (response.ok) {
        setBlogs(data.blogs || []);
      } else {
        setMessage('Failed to fetch blogs');
      }
    } catch {
      setMessage('Error fetching blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const url = editingBlog ? `/api/admin/blogs/${editingBlog.id}` : '/api/admin/blogs';
      const method = editingBlog ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!');
        setShowForm(false);
        setEditingBlog(null);
        resetForm();
        fetchBlogs();
      } else {
        setMessage(data.error || 'Failed to save blog');
      }
    } catch {
      setMessage('Error saving blog');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        setMessage('Blog deleted successfully!');
        fetchBlogs();
      } else {
        setMessage('Failed to delete blog');
      }
    } catch {
      setMessage('Error deleting blog');
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary,
      content: blog.content || '',
      image: blog.image || '',
      author: blog.author || '',
      category: blog.category || '',
      read_time: blog.read_time || '',
      status: blog.status || 'draft'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      image: '',
      author: '',
      category: '',
      read_time: '',
      status: 'draft'
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setMessage('');
    setGenerationProgress(0);

    try {
      // Step 1: Initialize
      setGenerationStep('Initializing AI generation...');
      setGenerationProgress(5);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Analyze topic
      setGenerationStep('Analyzing topic and requirements...');
      setGenerationProgress(15);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Preparing AI prompt
      setGenerationStep('Preparing AI prompt and parameters...');
      setGenerationProgress(25);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Step 4: Sending request to AI
      setGenerationStep('Sending request to AI service...');
      setGenerationProgress(35);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Step 5: AI is generating content
      setGenerationStep('AI is generating your blog content...');
      setGenerationProgress(45);
      
      // Make the actual API call
      const response = await fetch('/api/admin/blogs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiFormData)
      });

      // Step 6: Processing response
      setGenerationStep('Processing AI response...');
      setGenerationProgress(65);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = await response.json();
      
      if (response.ok) {
        // Step 7: Formatting content
        setGenerationStep('Formatting and prettifying content...');
        setGenerationProgress(75);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Auto-prettify the content
        const prettifiedContent = await prettifyContent(data.blog.content);
        
        // Step 8: Generating TOC
        setGenerationStep('Generating Table of Contents structure...');
        setGenerationProgress(85);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Step 9: Finalizing
        setGenerationStep('Finalizing blog post...');
        setGenerationProgress(95);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 10: Complete
        setGenerationProgress(100);
        setGenerationStep('Blog generated successfully!');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setFormData({
          title: data.blog.title || '',
          slug: data.blog.slug || '',
          summary: data.blog.summary || '',
          content: prettifiedContent,
          image: data.blog.image || '',
          author: data.blog.author || '',
          category: data.blog.category || '',
          read_time: data.blog.read_time || '',
          status: 'draft'
        });
        setShowForm(true);
        setActiveTab('manage');
        setMessage('Blog generated and prettified successfully! You can now edit and save it.');
      } else {
        setMessage(data.error || 'Failed to generate blog');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setMessage('Error generating blog. Please try again.');
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
      setGenerationStep('');
    }
  };

  const prettifyContent = async (content: string): Promise<string> => {
    // Enhanced auto-prettify content with rich formatting and visual hierarchy
    let prettified = content;
    
    // If content is already HTML, enhance it
    if (content.includes('<h2>') || content.includes('<p>')) {
      prettified = content
        // Ensure proper spacing around headings
        .replace(/(<h[1-6][^>]*>)/g, '\n\n$1')
        .replace(/(<\/h[1-6]>)/g, '$1\n\n')
        // Ensure proper paragraph spacing
        .replace(/(<p[^>]*>)/g, '\n$1')
        .replace(/(<\/p>)/g, '$1\n')
        // Clean up multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } else {
      // Convert markdown-style content to HTML
      prettified = content
        // Add proper spacing around headings
        .replace(/(#{1,6}\s+[^\n]+)/g, '\n\n$1\n\n')
        // Add spacing around paragraphs
        .replace(/([^\n])\n([^\n#])/g, '$1\n\n$2')
        // Format lists properly
        .replace(/(\n|^)([-*+]\s+)/g, '\n\n$2')
        .replace(/(\n|^)(\d+\.\s+)/g, '\n\n$2')
        // Clean up multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        // Trim whitespace
        .trim();
      
      // Convert to HTML formatting
      prettified = prettified
        .replace(/\n\n/g, '</p>\n\n<p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        // Format headings with proper IDs for TOC
        .replace(/<p>(#{1,6})\s+([^<]+)<\/p>/g, (match, hashes, text) => {
          const level = hashes.length;
          const id = text.trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          return `<h${level} id="${id}">${text.trim()}</h${level}>`;
        })
        // Format lists
        .replace(/<p>([-*+])\s+([^<]+)<\/p>/g, '<li>$2</li>')
        .replace(/(<li>[\s\S]*<\/li>)/g, '<ul>\n$1\n</ul>')
        .replace(/<p>(\d+)\. ([^<]+)<\/p>/g, '<li>$2</li>')
        .replace(/(<li>[\s\S]*<\/li>)/g, '<ol>\n$1\n</ol>')
        // Clean up empty paragraphs
        .replace(/<p>\s*<\/p>/g, '');
    }
    
    // Ensure all headings have IDs for TOC navigation
    prettified = prettified.replace(/<h([1-6])(?![^>]*id=)([^>]*)>([^<]+)<\/h[1-6]>/g, (match, level, attrs, text) => {
      const id = text.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });
    
    // Add visual enhancements and better formatting
    prettified = prettified
      // Add proper spacing between sections with extra breathing room
      .replace(/(<\/h[1-6]>)\s*(<p>)/g, '$1\n\n\n$2')
      .replace(/(<\/p>)\s*(<h[1-6])/g, '$1\n\n\n$2')
      // Ensure lists have proper spacing
      .replace(/(<\/p>)\s*(<[uo]l>)/g, '$1\n\n$2')
      .replace(/(<\/[uo]l>)\s*(<p>)/g, '$1\n\n$2')
      // Add spacing around blockquotes
      .replace(/(<\/p>)\s*(<blockquote>)/g, '$1\n\n$2')
      .replace(/(<\/blockquote>)\s*(<p>)/g, '$1\n\n$2')
      // Enhance blockquotes with classes for styling
      .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-primary pl-6 italic bg-muted/20 p-6 rounded-r-lg my-8 text-lg font-medium">')
      // Add classes to lists for better styling and spacing
      .replace(/<ul>/g, '<ul class="space-y-3 ml-6 my-6">')
      .replace(/<ol>/g, '<ol class="space-y-3 ml-6 my-6">')
      // Add emphasis to important paragraphs (those with strong tags)
      .replace(/<p>([^<]*<strong>[^<]*<\/strong>[^<]*)<\/p>/g, '<p class="font-semibold text-foreground/95 leading-relaxed">$1</p>')
      // Add better spacing for regular paragraphs
      .replace(/<p>(?!.*class=)/g, '<p class="leading-relaxed mb-6">')
      // Enhance headings with better spacing and typography
      .replace(/<h1>/g, '<h1 class="font-black text-4xl mb-8 mt-12 leading-tight">')
      .replace(/<h2>/g, '<h2 class="font-black text-3xl mb-6 mt-10 leading-tight">')
      .replace(/<h3>/g, '<h3 class="font-bold text-2xl mb-5 mt-8 leading-tight">')
      .replace(/<h4>/g, '<h4 class="font-bold text-xl mb-4 mt-6">')
      .replace(/<h5>/g, '<h5 class="font-bold text-lg mb-3 mt-5">')
      .replace(/<h6>/g, '<h6 class="font-bold text-base mb-2 mt-4">')
      // Clean up any remaining multiple newlines
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
    
    // Add visual breaks and call-to-action styling
    prettified = prettified
      // Style conclusion sections
      .replace(/(<h2[^>]*id="[^"]*conclusion[^"]*"[^>]*>)/gi, '$1')
      .replace(/(<h2[^>]*>.*?conclusion.*?<\/h2>)/gi, '<div class="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border-l-4 border-primary mt-8">$1')
      // Add highlight boxes for safety sections
      .replace(/(<h2[^>]*id="[^"]*safety[^"]*"[^>]*>)/gi, '<div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 my-8">$1')
      // Add tip boxes for pro tips sections  
      .replace(/(<h2[^>]*id="[^"]*tip[^"]*"[^>]*>)/gi, '<div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 my-8">$1');
    
    return prettified;
  };

  const generateTopicSuggestions = async () => {
    setLoadingTopics(true);
    try {
      const response = await fetch('/api/admin/blogs/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: aiFormData.category })
      });
      
      const data = await response.json();
      if (response.ok) {
        setSuggestedTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Error generating topic suggestions:', error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const selectSuggestedTopic = (topic: string) => {
    setAiFormData({ ...aiFormData, topic });
  };

  const sendNewsletter = async (blog: Blog) => {
    if (blog.status !== 'published') {
      setMessage('Only published blogs can be sent as newsletters');
      return;
    }

    try {
      setMessage('Sending newsletter...');
      const response = await fetch('/api/admin/blogs/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogId: blog.id,
          blogTitle: blog.title,
          blogSummary: blog.summary,
          blogSlug: blog.slug
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Newsletter sent successfully! Delivered to ${data.sent} subscribers${data.failed > 0 ? `, ${data.failed} failed` : ''}`);
      } else {
        setMessage(data.error || 'Failed to send newsletter');
      }
    } catch (error) {
      console.error('Newsletter send error:', error);
      setMessage('Failed to send newsletter');
    }
  };

  const copySlug = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(slug);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (error) {
      console.error('Failed to copy slug:', error);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    draft: blogs.filter(b => b.status === 'draft').length,
    categories: [...new Set(blogs.map(b => b.category).filter(Boolean))]
  };

  const BlogCardSkeleton = () => (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
    <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
    >
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                Blog Management
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Create, edit, and manage your content with AI assistance</p>
            </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBlog(null);
            resetForm();
          }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-105 shadow-lg"
        >
              <Plus className="w-6 h-6" />
              <span className="font-semibold">New Blog</span>
        </button>
      </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Blogs</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Published</p>
                    <p className="text-3xl font-bold text-foreground">{stats.published}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Drafts</p>
                    <p className="text-3xl font-bold text-foreground">{stats.draft}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                    <Edit className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Categories</p>
                    <p className="text-3xl font-bold text-foreground">{stats.categories.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

      {/* Tabs */}
          <div className="flex space-x-2 bg-muted rounded-2xl p-2">
        <button
          onClick={() => setActiveTab('manage')}
              className={`flex-1 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
            activeTab === 'manage'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
          }`}
        >
              <BarChart3 className="w-5 h-5" />
          Manage Blogs
        </button>
        <button
          onClick={() => setActiveTab('generate')}
              className={`flex-1 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
            activeTab === 'generate'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
          }`}
        >
              <Zap className="w-5 h-5" />
          AI Generate
        </button>
      </div>

      {/* Message */}
          <AnimatePresence>
      {message && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`p-6 rounded-2xl border ${
                  message.includes('successfully') 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {message.includes('successfully') ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                  <span className="font-medium">{message}</span>
        </div>
              </motion.div>
      )}
          </AnimatePresence>

      {/* Manage Blogs Tab */}
      {activeTab === 'manage' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Search and Filter */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search blogs by title, summary, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                  />
            </div>
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <div className="flex bg-muted rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                        viewMode === 'grid' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                        viewMode === 'list' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {/* Blogs Grid/List */}
              {loading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[...Array(6)].map((_, i) => (
                    <BlogCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredBlogs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">No blogs found</h3>
                  <p className="text-muted-foreground text-lg">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first blog to get started'
                    }
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  <AnimatePresence>
                    {filteredBlogs.map((blog, index) => (
                      <motion.div
                        key={blog.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        layout
                      >
                        <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                    {blog.title}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    blog.status === 'published' 
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                  }`}>
                                    {blog.status}
                                  </span>
                                </div>
                                <p className="text-muted-foreground text-sm line-clamp-3">{blog.summary}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {blog.status === 'published' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendNewsletter(blog);
                                    }}
                                    className="p-2 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-muted"
                                    title="Send newsletter"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copySlug(blog.slug);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-muted"
                                  title="Copy slug"
                                >
                                  {copiedSlug === blog.slug ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(blog);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-muted"
                                  title="Edit blog"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(blog.id);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-muted"
                                  title="Delete blog"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {blog.category && (
                                <div className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {blog.category}
                                </div>
                              )}
                              {blog.author && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {blog.author}
                                </div>
                              )}
                              {blog.read_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {blog.read_time}
            </div>
          )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(blog.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
        </div>
              )}
            </motion.div>
      )}

      {/* AI Generate Tab */}
      {activeTab === 'generate' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-3 text-2xl">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary-foreground" />
                    </div>
                    Generate Blog with AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAiGenerate} className="space-y-8">
            <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Topic</label>
                      <div className="space-y-4">
              <input
                type="text"
                value={aiFormData.topic}
                onChange={(e) => setAiFormData({ ...aiFormData, topic: e.target.value })}
                placeholder="e.g., Winter Trekking Safety Tips"
                        className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                required
              />
                        {/* Topic Suggestions */}
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={generateTopicSuggestions}
                            disabled={loadingTopics}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                          >
                            {loadingTopics ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                            {loadingTopics ? 'Generating...' : 'Suggest Topics'}
                          </button>
                          {suggestedTopics.map((topic, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectSuggestedTopic(topic)}
                              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all duration-300 text-sm font-medium border border-primary/20 hover:border-primary/40"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>
            </div>
            
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Category</label>
                <select
                  value={aiFormData.category}
                  onChange={(e) => setAiFormData({ ...aiFormData, category: e.target.value })}
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                >
                  <option value="Trekking Guide">Trekking Guide</option>
                  <option value="Health & Safety">Health & Safety</option>
                  <option value="Planning">Planning</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Destinations">Destinations</option>
                </select>
              </div>
              
              <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Tone</label>
                <select
                  value={aiFormData.tone}
                  onChange={(e) => setAiFormData({ ...aiFormData, tone: e.target.value })}
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>
              
              <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Length</label>
                <select
                  value={aiFormData.length}
                  onChange={(e) => setAiFormData({ ...aiFormData, length: e.target.value })}
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                >
                  <option value="short">Short (500-800 words)</option>
                  <option value="medium">Medium (1000-1200 words)</option>
                  <option value="long">Long (1500-2000 words)</option>
                </select>
              </div>
            </div>
            
            {/* Progress Tracking */}
            {generating && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-muted to-muted/80 rounded-xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm font-medium text-foreground">{generationStep}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Progress:</span>
                      <span className="text-sm font-bold text-primary">{generationProgress}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary/80 h-4 rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${generationProgress}%` }}
                    >
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {generationProgress < 50 
                      ? "Preparing your content..." 
                      : generationProgress < 80 
                      ? "AI is working on your blog..." 
                      : "Almost ready! Finalizing content..."
                    }
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={generating}
                      className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 disabled:scale-100 shadow-lg font-semibold text-lg"
            >
              {generating ? (
                <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground"></div>
                  {generationStep || 'Generating...'}
                </>
              ) : (
                <>
                          <Zap className="w-6 h-6" />
                  Generate Blog
                </>
              )}
            </button>
          </form>
                </CardContent>
              </Card>
            </motion.div>
      )}

      {/* Blog Form Modal */}
          <AnimatePresence>
      {showForm && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-card border rounded-2xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-foreground">
                {editingBlog ? 'Edit Blog' : 'Create New Blog'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBlog(null);
                  resetForm();
                }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-3 hover:bg-muted rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (!editingBlog) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
              </div>
              
              <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                        className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Read Time</label>
                  <input
                    type="text"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                    placeholder="e.g., 5 min read"
                          className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>
              
              <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                        className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={15}
                        className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                  placeholder="Write your blog content here..."
                />
              </div>
              
              <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              
                    <div className="flex gap-6 pt-6">
                <button
                  type="submit"
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
                >
                        <Save className="w-6 h-6" />
                  {editingBlog ? 'Update Blog' : 'Create Blog'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBlog(null);
                    resetForm();
                  }}
                        className="flex-1 bg-muted hover:bg-muted/80 text-foreground px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
                </motion.div>
        </div>
      )}
          </AnimatePresence>
    </motion.div>
      </div>
    </div>
  );
} 