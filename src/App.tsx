import React, { useEffect, useState } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Quote, 
  Facebook, 
  Play,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  MapPin, 
  HeartPulse, 
  Target, 
  Activity, 
  Phone,
  Sun,
  Moon,
  Menu,
  X,
  Crown,
  LogIn,
  Sparkles,
  Gift,
  ShieldCheck,
  Clock,
  ExternalLink,
  Flame,
  Award,
  BookOpen
} from 'lucide-react';
import Chatbot from './components/Chatbot';
import { RegistrationModal } from './components/RegistrationModal';
import { AuthModal, MemberUser } from './components/AuthModal';
import { MemberPortalModal } from './components/MemberPortalModal';
import { HealthCalculator } from './components/HealthCalculator';
import { BlogSection } from './components/BlogSection';
import { VideoModal } from './components/VideoModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminUser } from './types';
import { Language, translations } from './translations';
import { inferGenderFromName } from './utils/gender';
import { 
  GOOGLE_REVIEWS_BILINGUAL, 
  FACEBOOK_REVIEWS_BILINGUAL, 
  getGoogleReviewText, 
  getGoogleReviewTime, 
  getFacebookReviewText, 
  getFacebookAuthor 
} from './data/bilingualReviews';
import defaultTiktokVideos from './data/tiktokVideos.json';

type Review = {
  authorName: string;
  authorPhoto?: string | null;
  rating: number;
  text: string;
  textVi?: string;
  textEn?: string;
  time: string;
  timeVi?: string;
  timeEn?: string;
};

type FBReview = { 
  author: string; 
  text: string;
  textVi?: string;
  textEn?: string;
  dateVi?: string;
  dateEn?: string;
};
type TikTokComment = { 
  author: string; 
  comment: string; 
  time?: string;
  likes?: number;
  rank?: number;
};
type TikTokVideo = { 
  url: string; 
  videoId: string;
  caption: string;
  views: string | number;
  likes: string | number;
  commentCount: string | number;
  thumbnail?: string;
  comments: TikTokComment[];
};

export default function App() {
  // Bilingual state
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('the_shine_lang');
      if (saved === 'vi' || saved === 'en') return saved;
    }
    return 'vi';
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('the_shine_lang', lang);
  }, [lang]);

  // Data states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fbReviews, setFbReviews] = useState<FBReview[]>([]);
  const [tiktokVideos, setTiktokVideos] = useState<TikTokVideo[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllClips, setShowAllClips] = useState(false);

  // Modals
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedPackageForReg, setSelectedPackageForReg] = useState<string | undefined>(undefined);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [currentUser, setCurrentUser] = useState<MemberUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('the_shine_member');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && !parsed.gender) {
            parsed.gender = inferGenderFromName(parsed.fullName) || 'Nam';
          }
          return parsed;
        } catch (e) {}
      }
    }
    return null;
  });

  const [isMemberPortalOpen, setIsMemberPortalOpen] = useState(false);
  const [selectedVideoModal, setSelectedVideoModal] = useState<any>(null);

  // URL Routing: /admin dedicated for Admin, all other paths strictly customer website
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAdminRoute = currentPath.toLowerCase() === '/admin' || 
                       currentPath.toLowerCase() === '/admin/' || 
                       currentPath.toLowerCase().startsWith('/admin');

  // Admin Dashboard & RBAC States
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theshine_current_admin');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });

  const fallbackThumbnails = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
  ];

  const openRegistration = (packageName?: string) => {
    setSelectedPackageForReg(packageName);
    setIsRegModalOpen(true);
  };

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: MemberUser) => {
    if (!user.gender) {
      user.gender = inferGenderFromName(user.fullName) || 'Nam';
    }
    setCurrentUser(user);
    localStorage.setItem('the_shine_member', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('the_shine_member');
    setIsMemberPortalOpen(false);
  };

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch reviews & TikTok data
  useEffect(() => {
    Promise.all([
      fetch('/api/reviews')
        .then(res => (res.ok ? res.json() : { reviews: [] }))
        .catch(() => ({ reviews: [] })),
      fetch('/api/reviews/facebook')
        .then(res => (res.ok ? res.json() : { reviews: [] }))
        .catch(() => ({ reviews: [] })),
      fetch('/api/reviews/tiktok')
        .then(res => (res.ok ? res.json() : { videos: [] }))
        .catch(() => ({ videos: [] }))
    ]).then(([googleData, fbData, tiktokData]) => {
      if (googleData.reviews && googleData.reviews.length > 0) {
        setReviews(googleData.reviews);
      } else {
        setReviews(GOOGLE_REVIEWS_BILINGUAL.map(r => ({
          authorName: r.authorName,
          rating: r.rating,
          text: r.textVi,
          textVi: r.textVi,
          textEn: r.textEn,
          time: r.timeVi,
          timeVi: r.timeVi,
          timeEn: r.timeEn
        })));
      }

      if (fbData.reviews && fbData.reviews.length > 0) {
        setFbReviews(fbData.reviews);
      } else {
        setFbReviews(FACEBOOK_REVIEWS_BILINGUAL.map(f => ({
          author: f.author,
          text: f.textVi,
          textVi: f.textVi,
          textEn: f.textEn,
          dateVi: f.dateVi,
          dateEn: f.dateEn
        })));
      }

      if (tiktokData.videos && tiktokData.videos.length > 0) {
        setTiktokVideos(tiktokData.videos);
      } else {
        setTiktokVideos(defaultTiktokVideos as TikTokVideo[]);
      }
      setLoadingReviews(false);
    }).catch(err => {
      console.error("Failed to load data:", err);
      setReviews(GOOGLE_REVIEWS_BILINGUAL.map(r => ({
        authorName: r.authorName,
        rating: r.rating,
        text: r.textVi,
        textVi: r.textVi,
        textEn: r.textEn,
        time: r.timeVi,
        timeVi: r.timeVi,
        timeEn: r.timeEn
      })));
      setFbReviews(FACEBOOK_REVIEWS_BILINGUAL.map(f => ({
        author: f.author,
        text: f.textVi,
        textVi: f.textVi,
        textEn: f.textEn,
        dateVi: f.dateVi,
        dateEn: f.dateEn
      })));
      setTiktokVideos(defaultTiktokVideos as TikTokVideo[]);
      setLoadingReviews(false);
    });
  }, []);

  // Strict Route Check: Path /admin is exclusively the Admin System
  if (isAdminRoute) {
    if (currentAdmin) {
      return (
        <AdminDashboard
          currentAdmin={currentAdmin}
          onLogout={() => {
            setCurrentAdmin(null);
            localStorage.removeItem('theshine_current_admin');
          }}
          onExitAdmin={() => navigateTo('/')}
        />
      );
    }
    return (
      <AdminLoginPage
        onLoginSuccess={(admin) => {
          setCurrentAdmin(admin);
        }}
        onBackToHome={() => navigateTo('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200 selection:bg-brand-orange selection:text-white">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="fixed w-full top-0 bg-white/95 dark:bg-[#151515]/95 backdrop-blur-md z-40 border-b border-slate-200 dark:border-white/10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
            
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 group shrink-0">
              <div className="flex flex-col items-start leading-none italic font-heading transform -skew-x-6 select-none">
                <span className="bg-brand-orange text-white dark:text-brand-dark px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest mb-0.5 shadow-xs">The</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-brand-orange font-black text-2xl sm:text-3xl uppercase tracking-tighter">Shine</span>
                  <span className="text-slate-900 dark:text-white font-black text-2xl sm:text-3xl uppercase tracking-tighter transition-colors">Fitness</span>
                </div>
                <span className="text-brand-orange text-[0.45rem] sm:text-[0.5rem] font-bold uppercase tracking-widest mt-0.5">Shine On. Sweat On</span>
              </div>
            </a>

            {/* Desktop Navigation Links (Centered in the navbar with balanced spacing) */}
            <div className="hidden xl:flex flex-1 items-center justify-center space-x-2 2xl:space-x-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2">
              <a href="#services" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.services}
              </a>
              <a href="#specials" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.specials}
              </a>
              <a href="#health-calculator" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">
                <Activity size={13} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.bmiCalc}</span>
              </a>
              <a href="#blogs" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">
                <BookOpen size={13} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a href="#why-us" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.whyUs}
              </a>
              <a href="#reviews" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.reviews}
              </a>
              <a href="#location" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.contact}
              </a>
            </div>

            {/* Right Controls: Flag Language Selector -> Theme -> Member Portal (right before Book CTA) -> Book CTA -> Mobile Hamburger */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              
              {/* Language Selector By Flag (🇻🇳 / 🇬🇧) */}
              <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setLang('vi')}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                    lang === 'vi' 
                      ? 'bg-white dark:bg-white/20 shadow-xs ring-1 ring-black/5 dark:ring-white/10 scale-105' 
                      : 'opacity-40 hover:opacity-100'
                  }`}
                  title="Tiếng Việt (Việt Nam)"
                  aria-label="Chọn Tiếng Việt"
                >
                  <span className="text-base leading-none">🇻🇳</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                    lang === 'en' 
                      ? 'bg-white dark:bg-white/20 shadow-xs ring-1 ring-black/5 dark:ring-white/10 scale-105' 
                      : 'opacity-40 hover:opacity-100'
                  }`}
                  title="English (International)"
                  aria-label="Select English"
                >
                  <span className="text-base leading-none">🇬🇧</span>
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                aria-label={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
                title={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
              >
                {theme === 'dark' ? (
                  <Sun size={17} className="text-amber-400" />
                ) : (
                  <Moon size={17} className="text-slate-700" />
                )}
              </button>

              {/* Member Auth Button / Profile Pill (Positioned right before Đặt Lịch Tập) */}
              {currentUser ? (
                <button
                  onClick={() => setIsMemberPortalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title={t.nav.memberPortal}
                >
                  <Crown size={15} className="text-amber-500 shrink-0" />
                  <span className="max-w-[90px] truncate hidden sm:inline whitespace-nowrap">{currentUser.fullName}</span>
                  <span className="bg-brand-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">
                    {currentUser.membershipTier}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => openAuth('login')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer border border-slate-200 dark:border-white/10 whitespace-nowrap shrink-0"
                >
                  <LogIn size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{t.nav.memberLogin}</span>
                </button>
              )}

              {/* Primary Book CTA */}
              <button 
                onClick={() => openRegistration()}
                className="hidden md:inline-flex bg-brand-orange hover:bg-orange-600 text-white px-4 sm:px-5 py-2 font-heading font-bold text-xs uppercase italic transition-colors shadow-md rounded-xl cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="whitespace-nowrap">{t.nav.bookNow}</span>
              </button>

              {/* Hamburger Button for < xl screens */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus:outline-hidden cursor-pointer shrink-0"
                aria-label="Open Menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Vertical Navigation Drawer (Menu Dọc) */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-white/10 px-5 pt-4 pb-7 shadow-2xl transition-all">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {lang === 'vi' ? 'Menu Điều Hướng Dọc' : 'Navigation Menu'}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-heading font-bold text-xs uppercase italic">
              <a 
                href="#services" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Dumbbell size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.services}</span>
              </a>
              <a 
                href="#specials" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Gift size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.specials}</span>
              </a>
              <a 
                href="#health-calculator" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/15 transition-colors whitespace-nowrap"
              >
                <Activity size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.bmiCalc}</span>
              </a>
              <a 
                href="#blogs" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <BookOpen size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a 
                href="#why-us" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <ShieldCheck size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.whyUs}</span>
              </a>
              <a 
                href="#reviews" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Star size={15} className="text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">{t.nav.reviews}</span>
              </a>
              <a 
                href="#location" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <MapPin size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.contact}</span>
              </a>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-3">
              {currentUser ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); setIsMemberPortalOpen(true); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-heading font-bold text-xs uppercase italic flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Crown size={16} className="text-amber-500" />
                  <span className="whitespace-nowrap">{t.nav.memberPortal} ({currentUser.fullName})</span>
                </button>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); openAuth('login'); }}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 text-slate-800 dark:text-white font-heading font-bold text-xs uppercase italic flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <LogIn size={16} />
                  <span className="whitespace-nowrap">{t.nav.memberLogin} (OTP)</span>
                </button>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); openRegistration(); }}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-xs uppercase italic flex items-center justify-center gap-2 shadow-md whitespace-nowrap cursor-pointer"
              >
                <Calendar size={16} />
                <span className="whitespace-nowrap">{t.nav.bookNow}</span>
              </button>
            </div>


          </div>
        )}
      </nav>

      {/* 2. HERO SECTION (Mirroring lavina-nails.com structure) */}
      <header className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32 overflow-hidden border-b border-slate-200 dark:border-white/10">
        {/* Subtle Background glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-orange-400/20 via-amber-500/15 to-transparent blur-3xl rounded-full transform -rotate-12" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left">
              
              {/* Location Pill Header (lavina-nails.com style) */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-6 shadow-xs">
                <MapPin size={14} className="text-brand-orange shrink-0" />
                <span className="truncate">{t.hero.location}</span>
              </div>

              {/* Bold Headlines */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-heading font-black tracking-tight uppercase italic leading-[1.05] text-slate-900 dark:text-white">
                {t.hero.title1} <br />
                <span className="text-brand-orange">{t.hero.title2}</span>
              </h1>

              {/* Descriptive Subtitle */}
              <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                {t.hero.subtitle}
              </p>

              {/* Dual Action CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => openRegistration()}
                  className="w-full sm:w-auto bg-brand-orange hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-heading font-bold text-base sm:text-lg uppercase italic transition-all shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t.hero.bookNowFast} <ArrowRight size={20} />
                </button>
                <a
                  href="#specials"
                  className="w-full sm:w-auto bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 px-7 py-4 rounded-2xl font-heading font-bold text-base uppercase italic transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                >
                  {t.hero.viewServices}
                </a>
              </div>

              {/* Direct Hotline Phone Call Link */}
              <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                <Phone size={15} className="text-brand-orange" />
                <a href="tel:0946293593" className="hover:text-brand-orange font-bold transition-colors">
                  {t.hero.callPhone}
                </a>
              </div>
            </div>

            {/* Right Visual Image & Rating Card (lavina-nails.com style) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-4/3 sm:aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-white/10 bg-slate-900">
                {/* Hero Gym Image */}
                <img 
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80" 
                  alt="The Shine Fitness and Yoga" 
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Floating Social Proof Card */}
                <div className="absolute bottom-6 left-6 right-6 p-4 sm:p-5 bg-white/90 dark:bg-black/85 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-heading font-bold text-xl shrink-0 shadow-md">
                    ★
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm">
                      <Star size={15} className="fill-amber-400" />
                      <Star size={15} className="fill-amber-400" />
                      <Star size={15} className="fill-amber-400" />
                      <Star size={15} className="fill-amber-400" />
                      <Star size={15} className="fill-amber-400" />
                      <span className="font-bold text-slate-900 dark:text-white ml-1">{t.hero.rating}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                      {t.hero.lovedByLocals}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 3. HERO SPECIAL OFFER SECTION (Mirroring lavina-nails.com `hero-offer-new-customer` banner) */}
      <section className="py-12 sm:py-16 bg-white dark:bg-[#171717] border-b border-slate-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-2 border-brand-orange/40 shadow-xl overflow-hidden">
            
            {/* Background Accent */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-brand-orange">
              <Gift size={200} />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              <div className="flex-1 text-center lg:text-left space-y-3">
                
                {/* Pill Tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                  <Flame size={14} />
                  <span>{t.heroOffer.tag}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-900 dark:text-white uppercase italic leading-tight">
                  {t.heroOffer.headline}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {t.heroOffer.sub}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1 text-xs font-semibold text-brand-orange">
                  <span className="bg-brand-orange/15 px-2.5 py-1 rounded-md border border-brand-orange/30">
                    💰 {t.heroOffer.value}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    • {t.heroOffer.support}
                  </span>
                </div>
              </div>

              {/* Offer CTA Button */}
              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => openRegistration('Tập thử miễn phí 3 ngày (Voucher)')}
                  className="w-full sm:w-auto px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base sm:text-lg uppercase italic rounded-2xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gift size={20} />
                  {t.heroOffer.bookNow}
                </button>
                <a
                  href="tel:0946293593"
                  className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors"
                >
                  {t.heroOffer.orCall}
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SERVICES SECTION (Mirroring lavina-nails.com `ourServices` / `selfCare`) */}
      <section id="services" className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.services.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
              {t.services.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.services.sub}
            </p>
          </div>

          {/* Services Grid (6 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {t.services.items.map((item, index) => {
              const icons = [
                <Dumbbell key="1" size={28} className="text-brand-orange" />,
                <HeartPulse key="2" size={28} className="text-brand-orange" />,
                <Activity key="3" size={28} className="text-brand-orange" />,
                <Users key="4" size={28} className="text-brand-orange" />,
                <Sparkles key="5" size={28} className="text-brand-orange" />,
                <Target key="6" size={28} className="text-brand-orange" />
              ];

              return (
                <div 
                  key={item.id || index}
                  className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-brand-orange/60 dark:hover:border-brand-orange/50 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {icons[index % icons.length]}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-heading font-bold uppercase italic text-slate-900 dark:text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                      {item.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openRegistration(`Dịch vụ: ${item.title}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-orange hover:text-orange-600 cursor-pointer pt-2 group/btn"
                  >
                    <span>{t.services.learnMore}</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. SPECIALS & MEMBERSHIP PRICING (Mirroring lavina-nails.com `topSpecials`) */}
      <section id="specials" className="py-20 sm:py-28 bg-slate-100 dark:bg-[#181818] border-y border-slate-200 dark:border-white/10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.specials.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
              {t.specials.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.specials.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* 1. Gói Ưu Đãi Hội Viên Mới (349k - Star Offer from Facebook) */}
            <div className="bg-white dark:bg-[#141414] rounded-3xl p-7 sm:p-8 border-2 border-brand-orange shadow-2xl relative md:-translate-y-2 flex flex-col justify-between">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-md whitespace-nowrap">
                {t.specials.popularTag}
              </div>
              <div>
                <div className="flex items-center justify-between mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                    {t.specials.basic.name}
                  </h3>
                  {(t.specials.basic as any).badge && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {(t.specials.basic as any).badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-brand-orange">
                    {t.specials.basic.price}
                  </span>
                  <span className="text-slate-500 font-medium text-sm">
                    {t.specials.month}
                  </span>
                  {(t.specials.basic as any).originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {(t.specials.basic as any).originalPrice}{t.specials.month}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-brand-orange font-semibold mb-6">
                  {lang === 'vi' ? '★ Áp dụng cho cả Gym và Boxing' : '★ Valid for both Gym & Boxing'}
                </p>

                <ul className="space-y-3 mb-8">
                  {t.specials.basic.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      <CheckCircle2 size={17} className="text-brand-orange shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => openRegistration(t.specials.basic.name)}
                className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base uppercase italic rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                {t.specials.selectPlan}
              </button>
            </div>

            {/* 2. Gói Tiêu Chuẩn Tháng (549k) */}
            <div className="bg-white dark:bg-[#141414] rounded-3xl p-7 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-brand-orange/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                    {t.specials.premium.name}
                  </h3>
                  {(t.specials.premium as any).badge && (
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                      {(t.specials.premium as any).badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-slate-900 dark:text-white">
                    {t.specials.premium.price}
                  </span>
                  <span className="text-slate-500 font-medium text-sm">
                    {t.specials.month}
                  </span>
                  {(t.specials.premium as any).originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {(t.specials.premium as any).originalPrice}{t.specials.month}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-6">
                  {lang === 'vi' ? '★ Đóng từng tháng tự do, không cam kết dài hạn' : '★ Month-to-month flexibility, zero contracts'}
                </p>

                <ul className="space-y-3 mb-8">
                  {t.specials.premium.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={17} className="text-brand-orange shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => openRegistration(t.specials.premium.name)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-heading font-bold text-base uppercase italic rounded-2xl transition-colors cursor-pointer"
              >
                {t.specials.selectPlan}
              </button>
            </div>

            {/* 3. Gói Toàn Diện Yoga & Gym (699k) */}
            <div className="bg-white dark:bg-[#141414] rounded-3xl p-7 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-brand-orange/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                    {t.specials.vip.name}
                  </h3>
                  {(t.specials.vip as any).badge && (
                    <span className="text-[11px] font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full border border-brand-orange/20">
                      {(t.specials.vip as any).badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-slate-900 dark:text-white">
                    {t.specials.vip.price}
                  </span>
                  <span className="text-slate-500 font-medium text-sm">
                    {t.specials.month}
                  </span>
                  {(t.specials.vip as any).originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {(t.specials.vip as any).originalPrice}{t.specials.month}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-6">
                  {lang === 'vi' ? '★ Không giới hạn Yoga theo lịch & Full Gym' : '★ Unlimited Yoga timetable & full gym access'}
                </p>

                <ul className="space-y-3 mb-8">
                  {t.specials.vip.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={17} className="text-brand-orange shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => openRegistration(t.specials.vip.name)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-heading font-bold text-base uppercase italic rounded-2xl transition-colors cursor-pointer"
              >
                {t.specials.selectPlan}
              </button>
            </div>

          </div>

          {/* Crawled Facebook Policy Highlights Strip */}
          <div className="mt-12 max-w-6xl mx-auto bg-slate-50 dark:bg-[#151515] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🎫</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white">
                    {lang === 'vi' ? 'Vé Ngày Day Pass: 100k' : 'Day Pass: 100,000 VND'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Trải nghiệm tự do máy Gym, Cardio, Xông hơi & Tủ locker trọn ngày.' : 'Full single-day pass including gym zones, sauna and digital lockers.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🎓</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white">
                    {lang === 'vi' ? 'Giảm 20% Học Sinh - SV' : '20% Student Discount'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Áp dụng trực tiếp khi xuất trình thẻ học sinh, sinh viên còn thời hạn.' : 'Instant discount when presenting valid student identification.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🎁</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white">
                    {lang === 'vi' ? 'Voucher 3-7 Ngày 0đ' : '3-7 Day Free Pass'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Tặng thẻ trải nghiệm 0đ & miễn phí đo InBody 270 cùng Huấn luyện viên.' : 'Complimentary trial days with full InBody body analysis.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🤝</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white">
                    {lang === 'vi' ? 'Cam Kết 3 Không' : 'Our 3 Zero Promises'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Không ép gói dài hạn, Không phụ phí ẩn, Không chèo kéo dịch vụ PT.' : 'Zero contract traps, zero hidden fees, zero aggressive upselling.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5.5 HEALTH & FITNESS ASSESSMENT (BMI / TDEE / BODY FAT / FIREBASE DATABASE) */}
      <HealthCalculator lang={lang} onOpenBooking={openRegistration} />

      {/* 6. WHY CHOOSE THE SHINE (Mirroring lavina-nails.com `whyEyebrow` & `whyHeading`) */}
      <section id="why-us" className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.whyUs.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
              {t.whyUs.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.whyUs.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {t.whyUs.pillars.map((pillar, i) => {
              const icons = [
                <Award key="1" size={32} className="text-brand-orange" />,
                <Dumbbell key="2" size={32} className="text-brand-orange" />,
                <Sparkles key="3" size={32} className="text-brand-orange" />,
                <Users key="4" size={32} className="text-brand-orange" />
              ];

              return (
                <div 
                  key={i}
                  className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-slate-200 dark:border-white/10 text-center flex flex-col items-center group hover:border-brand-orange/50 transition-all shadow-xs"
                >
                  <div className="w-20 h-20 rounded-full bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {icons[i % icons.length]}
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-bold uppercase italic text-slate-900 dark:text-white mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. REVIEWS & TESTIMONIALS (Mirroring lavina-nails.com `lovedBy` & `clientsSay`) */}
      <section id="reviews" className="py-20 sm:py-28 bg-slate-100 dark:bg-[#171717] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.reviews.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
              {t.reviews.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.reviews.sub}
            </p>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange" />
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* Google Maps Reviews */}
              {reviews.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="text-brand-orange shrink-0" size={24} />
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                      {t.reviews.googleReview}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reviews.slice(0, 3).map((rev, i) => (
                      <div key={i} className="bg-white dark:bg-[#141414] p-7 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs relative flex flex-col justify-between">
                        <Quote className="absolute top-6 right-6 text-slate-200 dark:text-white/5 pointer-events-none" size={42} />
                        <div>
                          <div className="flex gap-1 mb-4">
                            {[...Array(rev.rating || 5)].map((_, idx) => (
                              <Star key={idx} className="text-amber-400 fill-amber-400" size={16} />
                            ))}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed mb-6 line-clamp-4">
                            "{getGoogleReviewText(rev, lang)}"
                          </p>
                        </div>
                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                          <div className="w-10 h-10 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold text-sm">
                            {rev.authorName?.charAt(0) || 'K'}
                          </div>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {rev.authorName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {getGoogleReviewTime(rev.timeVi || rev.time, lang)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facebook Feed Reviews */}
              {fbReviews.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Facebook className="text-[#1877F2] shrink-0" size={24} />
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                      {t.reviews.fbReview}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {fbReviews.slice(0, 4).map((rev, i) => (
                      <div key={i} className="bg-white dark:bg-[#141414] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-white/5">
                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                              {rev.author?.charAt(0) || 'F'}
                            </div>
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {getFacebookAuthor(rev.author, lang)}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm italic leading-relaxed line-clamp-4">
                            "{getFacebookReviewText(rev, lang)}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </section>

      {/* 8. TIKTOK CHANNELS SECTION (Top 3 comments & thumbnails preserved!) */}
      <section id="tiktok" className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.tiktok.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
              {t.tiktok.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.tiktok.sub}
            </p>
          </div>

          {tiktokVideos.length > 0 && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {(showAllClips ? tiktokVideos : tiktokVideos.slice(0, 4)).map((video, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col sm:flex-row gap-5 sm:gap-6 bg-white dark:bg-[#181818] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs hover:border-brand-orange/50 transition-all duration-300"
                  >
                    {/* Thumbnail & Play Link */}
                    <div className="w-full sm:w-44 shrink-0 flex flex-col items-center">
                      {video.videoId ? (
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedVideoModal({
                              ...video,
                              thumbnail: video.thumbnail || fallbackThumbnails[i % fallbackThumbnails.length]
                            });
                          }}
                          className="block relative w-full aspect-9/16 bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 dark:border-white/10 hover:border-brand-orange transition-all group shadow-md text-left cursor-pointer"
                        >
                          <img 
                            src={video.thumbnail || fallbackThumbnails[i % fallbackThumbnails.length]} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            alt={video.caption} 
                            onError={(e) => {
                              e.currentTarget.src = fallbackThumbnails[i % fallbackThumbnails.length];
                            }} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/70 transition-colors" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 group-hover:text-brand-orange transition-colors">
                            <div className="w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play size={20} className="fill-white translate-x-0.5" />
                            </div>
                            <span className="mt-2.5 text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white/90 px-3 py-1 rounded-full border border-white/20 backdrop-blur-xs">
                              {t.tiktok.viewOnTiktok}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div className="w-full aspect-9/16 bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500">
                          Video
                        </div>
                      )}

                      <div className="flex justify-center gap-3 mt-3 text-xs font-bold text-slate-600 dark:text-slate-400 w-full">
                        <span title={t.tiktok.views}>👁 {Number(video.views || 0).toLocaleString()}</span>
                        <span title={t.tiktok.likes}>❤️ {Number(video.likes || 0).toLocaleString()}</span>
                        <span title={t.tiktok.comments}>💬 {video.commentCount || 0}</span>
                      </div>
                    </div>

                    {/* Caption & Top 3 Comments */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-4 italic leading-relaxed">
                        "{video.caption}"
                      </p>

                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-white/5 pb-2">
                        <h4 className="text-brand-orange font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <MessageCircle size={14} />
                          {t.tiktok.topComments}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                          {video.comments?.length || 0}/3
                        </span>
                      </div>

                      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[260px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
                        {video.comments && video.comments.length > 0 ? (
                          video.comments.map((comment, idx) => (
                            <div 
                              key={idx} 
                              className="bg-slate-50 dark:bg-black/30 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 hover:border-brand-orange/40 transition-colors"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-4 h-4 rounded-full bg-brand-orange/20 text-brand-orange text-[9px] font-bold flex items-center justify-center shrink-0">
                                    #{comment.rank || (idx + 1)}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                    @{comment.author}
                                  </span>
                                </div>
                                {comment.likes !== undefined && comment.likes > 0 && (
                                  <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 shrink-0 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">
                                    ❤️ {comment.likes}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed pl-5">
                                "{comment.comment}"
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 text-xs italic p-4 text-center">
                            {lang === 'vi' ? 'Chưa có bình luận cho video này.' : 'No comments available for this video.'}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {tiktokVideos.length > 4 && (
                <div className="mt-8 text-center">
                  <button 
                    onClick={() => setShowAllClips(!showAllClips)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider bg-white dark:bg-[#181818] hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    {showAllClips ? (
                      <>
                        {t.tiktok.showLess}
                        <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        {t.tiktok.showMore} ({tiktokVideos.length - 4})
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* 8.5 FITNESS & NUTRITION BLOG ARTICLES SECTION (Crawl & Blog Updates) */}
      <BlogSection lang={lang} />

      {/* 9. VISIT US & CONTACT (Mirroring lavina-nails.com `visitUs` & `comeSayHello`) */}
      <section id="location" className="py-20 sm:py-28 bg-slate-100 dark:bg-[#181818] border-t border-slate-200 dark:border-white/10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Contact Info */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
                  {t.visitUs.eyebrow}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
                  {t.visitUs.heading}
                </h2>
                <div className="w-20 h-1 bg-brand-orange my-4 rounded-full" />
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                  {t.visitUs.sub}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Address */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10">
                  <MapPin size={22} className="text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400">
                      {t.visitUs.addressTitle}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                      {t.visitUs.addressValue}
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10">
                  <Clock size={22} className="text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400">
                      {t.visitUs.hoursTitle}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                      {t.visitUs.hoursValue}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10">
                  <Phone size={22} className="text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400">
                      {t.visitUs.hotlineTitle}
                    </div>
                    <a 
                      href="tel:0946293593" 
                      className="text-lg sm:text-xl font-heading font-black text-brand-orange hover:underline block mt-0.5"
                    >
                      0946 293 593
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => openRegistration()}
                  className="px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base uppercase italic rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Calendar size={18} />
                  {t.visitUs.bookAppointment}
                </button>
                <a
                  href="https://maps.app.goo.gl/Hyn5UHxdnvFDETjc6"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-4 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 font-heading font-bold text-sm uppercase italic rounded-2xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  {t.visitUs.directions}
                </a>
              </div>
            </div>

            {/* Right Map Embed / Card */}
            <div className="lg:col-span-6">
              <div className="w-full h-[380px] sm:h-[440px] rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-white/10 shadow-2xl relative bg-slate-900">
                <iframe
                  title="The Shine Fitness and Yoga Map Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0596813417123!2d106.64544821116557!3d10.806741089299381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529001b03dc27%3A0xb330cd3c87756a6e!2sThe%20Shine%20Fitness%20and%20Yoga!5e0!3m2!1sen!2s!4v1789467523408!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="w-full h-full filter contrast-105"
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 10. FOOTER (Mirroring lavina-nails.com footer structure) */}
      <footer className="bg-slate-950 dark:bg-black py-16 border-t-2 border-brand-orange text-slate-300 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 items-start">
            
            {/* Brand column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex flex-col items-start leading-none italic font-heading transform -skew-x-6 select-none">
                <span className="bg-brand-orange text-white dark:text-brand-dark px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest mb-0.5">The</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-brand-orange font-black text-3xl uppercase tracking-tighter">Shine</span>
                  <span className="text-white font-black text-3xl uppercase tracking-tighter">Fitness</span>
                </div>
                <span className="text-brand-orange text-[0.5rem] font-bold uppercase tracking-widest mt-0.5">Shine On. Sweat On</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                {t.footer.about}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <a 
                  href="tel:0946293593"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white text-xs font-bold uppercase rounded-xl hover:bg-orange-600 transition-colors"
                >
                  <Phone size={14} />
                  0946 293 593
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                {t.footer.quickLinks}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#services" className="hover:text-brand-orange transition-colors">{t.nav.services}</a></li>
                <li><a href="#specials" className="hover:text-brand-orange transition-colors">{t.nav.specials}</a></li>
                <li><a href="#why-us" className="hover:text-brand-orange transition-colors">{t.nav.whyUs}</a></li>
                <li><a href="#reviews" className="hover:text-brand-orange transition-colors">{t.nav.reviews}</a></li>
                <li><a href="#tiktok" className="hover:text-brand-orange transition-colors">{t.nav.tiktok}</a></li>
                <li><a href="#location" className="hover:text-brand-orange transition-colors">{t.nav.contact}</a></li>
              </ul>
            </div>

            {/* Address & Hours */}
            <div className="lg:col-span-4 space-y-3 text-xs text-slate-400">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                {t.visitUs.eyebrow}
              </h4>
              <a
                href="https://maps.app.goo.gl/Hyn5UHxdnvFDETjc6"
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 hover:text-white transition-colors group"
              >
                <MapPin size={16} className="text-brand-orange shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span>{t.footer.address}</span>
              </a>
              <p className="flex items-start gap-2">
                <Clock size={16} className="text-brand-orange shrink-0 mt-0.5" />
                <span>{t.footer.hours}</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone size={16} className="text-brand-orange shrink-0 mt-0.5" />
                <span>{t.footer.hotline}</span>
              </p>
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
            <div>&copy; {new Date().getFullYear()} The Shine Fitness & Yoga. {t.footer.rights}</div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setLang('vi')} 
                className={`hover:text-white transition-colors cursor-pointer ${lang === 'vi' ? 'text-brand-orange font-bold' : ''}`}
              >
                Tiếng Việt (VN)
              </button>
              <span>•</span>
              <button 
                onClick={() => setLang('en')} 
                className={`hover:text-white transition-colors cursor-pointer ${lang === 'en' ? 'text-brand-orange font-bold' : ''}`}
              >
                English (EN)
              </button>
              <span>•</span>
              <a 
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/admin');
                }}
                className="hover:text-slate-300 transition-colors cursor-pointer text-slate-500 flex items-center gap-1 text-xs"
                title="Cổng Quản Trị (/admin)"
              >
                <ShieldCheck size={12} className="text-slate-500" />
                <span>Quản Trị (/admin)</span>
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating AI Chatbot Concierge */}
      <Chatbot 
        lang={lang} 
        currentUser={currentUser} 
        onOpenTrialModal={() => {
          setSelectedPackageForReg('Gói Thử Thể Hình 03 Ngày VIP');
          setIsRegModalOpen(true);
        }}
      />

      {/* Registration & Trial Pass Modal */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        defaultPackage={selectedPackageForReg}
        lang={lang}
      />

      {/* Member Auth Modal (Login & Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        lang={lang}
      />

      {/* Member Digital Card & Portal */}
      {currentUser && (
        <MemberPortalModal
          isOpen={isMemberPortalOpen}
          onClose={() => setIsMemberPortalOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
          lang={lang}
        />
      )}

      {/* Community Video Modal Player */}
      <VideoModal
        isOpen={!!selectedVideoModal}
        onClose={() => setSelectedVideoModal(null)}
        video={selectedVideoModal}
        lang={lang}
      />

    </div>
  );
}
