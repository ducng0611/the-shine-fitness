import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  ArrowRight, 
  RefreshCw, 
  Search, 
  Tag, 
  User, 
  X, 
  Sparkles,
  Share2,
  Bookmark
} from 'lucide-react';
import { initialBlogPosts, mockCrawledFeed } from '../data/blogData';
import { BlogPost } from '../types';
import { Language } from '../translations';

interface BlogSectionProps {
  lang: Language;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ lang }) => {
  const isVi = lang === 'vi';
  const [posts, setPosts] = useState<BlogPost[]>([...initialBlogPosts, ...mockCrawledFeed]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlSuccessMsg, setCrawlSuccessMsg] = useState('');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);

  const categories = [
    { id: 'all', labelVi: 'Tất Cả', labelEn: 'All Posts' },
    { id: 'Dinh Dưỡng', labelVi: 'Dinh Dưỡng', labelEn: 'Nutrition' },
    { id: 'Tập Luyện', labelVi: 'Tập Luyện', labelEn: 'Workouts' },
    { id: 'Giảm Cân', labelVi: 'Giảm Cân', labelEn: 'Fat Loss' },
    { id: 'Yoga & Sức Khỏe', labelVi: 'Yoga & Sức Khỏe', labelEn: 'Yoga & Recovery' }
  ];

  // Crawl / Refresh articles simulation
  const handleCrawlNews = () => {
    setIsCrawling(true);
    setCrawlSuccessMsg('');

    setTimeout(() => {
      // Add mock crawled feed items if not already present
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = mockCrawledFeed.filter(p => !existingIds.has(p.id));
        if (newPosts.length > 0) {
          return [...newPosts, ...prev];
        }
        return prev;
      });
      setIsCrawling(false);
      setCrawlSuccessMsg(
        isVi 
          ? 'Đã cập nhật các bài viết thể hình và dinh dưỡng mới nhất!' 
          : 'Successfully fetched the latest fitness and nutrition articles!'
      );
      setTimeout(() => setCrawlSuccessMsg(''), 4000);
    }, 1200);
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesQuery = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <section id="blogs" className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Crawl/Refresh Trigger */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <span className="text-brand-orange font-bold text-sm uppercase tracking-widest block mb-2">
              {isVi ? 'KIẾN THỨC & TIN TỨC' : 'INSIGHTS & NEWS'}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
              {isVi ? 'Blog Thể Hình, Yoga & Dinh Dưỡng Khoa Học' : 'Fitness, Yoga & Evidence-Based Nutrition'}
            </h2>
            <div className="w-20 h-1 bg-brand-orange my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
              {isVi 
                ? 'Tổng hợp bài viết chuyên môn, giáo án tập luyện và bí quyết duy trì lối sống lành mạnh được cập nhật liên tục từ các chuyên gia thể hình The Shine.'
                : 'Curated workout guides, training blueprints, and nutritional insights from certified coaches and wellness masters.'}
            </p>
          </div>

          {/* Crawl / Refresh Action Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button
              onClick={handleCrawlNews}
              disabled={isCrawling}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 hover:border-brand-orange text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
              title="Crawl new articles"
            >
              <RefreshCw size={16} className={`text-brand-orange ${isCrawling ? 'animate-spin' : ''}`} />
              <span>{isCrawling ? (isVi ? 'Đang cập nhật nguồn tin...' : 'Crawling news feed...') : (isVi ? 'Cập Nhật Tin Mới' : 'Refresh News Feed')}</span>
            </button>
          </div>
        </div>

        {/* Success toast from crawl */}
        {crawlSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-sm sm:text-base font-medium flex items-center justify-between animate-fadeIn">
            <span>✨ {crawlSuccessMsg}</span>
            <button onClick={() => setCrawlSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:border-brand-orange/40'
                }`}
              >
                {isVi ? cat.labelVi : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={isVi ? 'Tìm kiếm bài viết, chủ đề...' : 'Search articles, tags...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-orange"
            />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <article
              key={post.id}
              className="bg-white dark:bg-[#181818] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-brand-orange/50 transition-all duration-300 shadow-xs hover:shadow-xl flex flex-col justify-between group cursor-pointer"
              onClick={() => setActiveArticle(post)}
            >
              <div>
                {/* Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-900">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {post.readTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {post.publishedAt}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg sm:text-xl uppercase italic text-slate-900 dark:text-white leading-snug group-hover:text-brand-orange transition-colors line-clamp-2 mb-3">
                    {post.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {post.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Author & CTA Footer */}
              <div className="px-6 sm:px-7 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {post.author.name}
                  </span>
                </div>

                <span className="text-brand-orange text-sm font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{isVi ? 'Đọc tiếp' : 'Read'}</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-40 text-brand-orange" />
            <p className="text-base font-medium">
              {isVi ? 'Không tìm thấy bài viết nào phù hợp với bộ lọc.' : 'No articles match your search criteria.'}
            </p>
          </div>
        )}

      </div>

      {/* ARTICLE READER MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="relative aspect-16/9 sm:aspect-21/9 shrink-0 bg-slate-900">
              <img
                src={activeArticle.imageUrl}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="bg-brand-orange text-white text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                  {activeArticle.category}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black uppercase italic leading-tight">
                  {activeArticle.title}
                </h2>
              </div>
            </div>

            {/* Author bar */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/20 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <img
                  src={activeArticle.author.avatar}
                  alt={activeArticle.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {activeArticle.author.name}
                  </div>
                  <div>{activeArticle.author.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span>{activeArticle.publishedAt}</span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
              <div className="p-4 rounded-2xl bg-orange-500/10 border-l-4 border-brand-orange italic text-slate-800 dark:text-slate-200 font-medium">
                "{activeArticle.excerpt}"
              </div>

              {activeArticle.content.map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}

              <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-brand-orange" />
                  <div className="flex flex-wrap gap-1.5">
                    {activeArticle.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-xs uppercase italic rounded-xl transition-colors cursor-pointer"
                >
                  {isVi ? 'Đóng bài viết' : 'Close Article'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
