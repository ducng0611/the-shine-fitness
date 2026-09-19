import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { FadeIn } from './components/FadeIn';
import { Toast } from './components/Toast';
import { PWAInstallButton } from './components/PWAInstallButton';

import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { SpecialsPage } from './pages/SpecialsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { NewsPage } from './pages/NewsPage';
import { ContactPage } from './pages/ContactPage';

import React, { useEffect, useState } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Quote, 
  Facebook, Instagram, MessageCircle as ZaloIcon, 
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
, Check } from 'lucide-react';
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
import { safeStorage } from './utils/storage';
import { 
  GOOGLE_REVIEWS_BILINGUAL, 
  FACEBOOK_REVIEWS_BILINGUAL, 
  getGoogleReviewText, 
  getGoogleReviewTime, 
  getFacebookReviewText, 
  getFacebookAuthor 
} from './data/bilingualReviews';
import defaultTiktokVideos from './data/tiktokVideos.json';
import { ScrollToTop } from './components/ScrollToTop';
import { ScrollProgress } from './components/ScrollProgress';


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
  commentEn?: string;
  commentVi?: string; 
  time?: string;
  likes?: number;
  rank?: number;
};
type TikTokVideo = { 
  url: string; 
  videoId: string;
  caption: string;
  captionEn?: string;
  captionVi?: string;
  views: string | number;
  likes: string | number;
  commentCount: string | number;
  thumbnail?: string;
  comments: TikTokComment[];
};

export default function App() {
  // Bilingual state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    const saved = safeStorage.getItem('the_shine_lang');
    if (saved === 'vi' || saved === 'en') return saved;
    return 'vi';
  });

  const t = translations[lang];

  useEffect(() => {
    safeStorage.setItem('the_shine_lang', lang);
  }, [lang]);

  useEffect(() => {
    const timer = setTimeout(() => setIsServicesLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Data states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fbReviews, setFbReviews] = useState<FBReview[]>([]);
  const [tiktokVideos, setTiktokVideos] = useState<TikTokVideo[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllClips, setShowAllClips] = useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(() => {
    return safeStorage.getItem('the_shine_autoplay') === 'true';
  });

  useEffect(() => {
    safeStorage.setItem('the_shine_autoplay', String(isAutoPlayEnabled));
  }, [isAutoPlayEnabled]);

  // Modals
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedPackageForReg, setSelectedPackageForReg] = useState<string | undefined>(undefined);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [currentUser, setCurrentUser] = useState<MemberUser | null>(() => {
    const saved = safeStorage.getItem('the_shine_member');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.gender) {
          parsed.gender = inferGenderFromName(parsed.fullName) || 'Nam';
        }
        return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [isMemberPortalOpen, setIsMemberPortalOpen] = useState(false);
  const [selectedVideoModal, setSelectedVideoModal] = useState<any>(null);

  // URL Routing with react-router-dom
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const navigateTo = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminRoute = currentPath.toLowerCase() === '/admin' || 
                       currentPath.toLowerCase() === '/admin/' || 
                       currentPath.toLowerCase().startsWith('/admin');

  // Admin Dashboard & RBAC States
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = safeStorage.getItem('theshine_current_admin');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
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
    safeStorage.setItem('the_shine_member', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    safeStorage.removeItem('the_shine_member');
    setIsMemberPortalOpen(false);
  };

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = safeStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia) {
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
    safeStorage.setItem('theme', theme);
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
            safeStorage.removeItem('theshine_current_admin');
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
      <ScrollProgress />

      
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="fixed w-full top-0 bg-white/95 dark:bg-[#151515]/95 backdrop-blur-md z-40 border-b border-slate-200 dark:border-white/10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
            
            {/* Logo */}
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('/'); }} className="flex items-center gap-2 group shrink-0">
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
              <a href="/dich-vu" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/dich-vu"); }} className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.services}
              </a>
              <a href="/khuyen-mai" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khuyen-mai"); }} className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.specials}
              </a>
              
              <a href="/tin-tuc" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/tin-tuc"); }} className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">
                <BookOpen size={13} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a href="/khach-hang" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khach-hang"); }} className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.reviews}
              </a>
              <a href="/lien-he" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/lien-he"); }} className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.contact}
              </a>
            </div>

            {/* Right Controls: Flag Language Selector -> Theme -> Member Portal (right before Book CTA) -> Book CTA -> Mobile Hamburger */}
            <div className="hidden md:flex items-center shrink-0">
              <PWAInstallButton lang={lang} />
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              
              {/* Language Selector Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title="Select Language"
                >
                  <span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm">{lang === 'vi' ? <img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN" className="rounded-sm shadow-sm" /> : <img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="20" alt="US" className="rounded-sm shadow-sm" />}</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
                
                <div className="absolute top-full right-0 mt-2 w-44 py-1.5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 origin-top-right transform scale-95 group-hover:scale-100">
                  <button
                    onClick={() => setLang('vi')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${lang === 'vi' ? 'text-brand-orange font-bold bg-orange-50/50 dark:bg-brand-orange/10 border-l-2 border-brand-orange' : 'text-slate-700 dark:text-slate-300 border-l-2 border-transparent'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm"><img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN" className="rounded-sm shadow-sm" /></span>
                      <span className="whitespace-nowrap">Tiếng Việt</span>
                    </div>
                    {lang === 'vi' && <Check size={16} className="text-brand-orange" />}
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${lang === 'en' ? 'text-brand-orange font-bold bg-orange-50/50 dark:bg-brand-orange/10 border-l-2 border-brand-orange' : 'text-slate-700 dark:text-slate-300 border-l-2 border-transparent'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm"><img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="20" alt="US" className="rounded-sm shadow-sm" /></span>
                      <span className="whitespace-nowrap">English</span>
                    </div>
                    {lang === 'en' && <Check size={16} className="text-brand-orange" />}
                  </button>
                </div>
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
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors cursor-pointer border border-brand-orange/20 whitespace-nowrap shrink-0"
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
                
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 font-heading font-bold text-xs uppercase italic">
              <a 
                href="/dich-vu" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/dich-vu"); }} 
                
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Dumbbell size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.services}</span>
              </a>
              <a 
                href="/khuyen-mai" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khuyen-mai"); }} 
                
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Gift size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.specials}</span>
              </a>
              
              <a 
                href="/tin-tuc" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/tin-tuc"); }} 
                
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <BookOpen size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a 
                href="/khach-hang" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khach-hang"); }} 
                
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Star size={15} className="text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">{t.nav.reviews}</span>
              </a>
              <a 
                href="/lien-he" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/lien-he"); }} 
                
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <MapPin size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.contact}</span>
              </a>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-3">
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
                  className="flex-1 py-3 px-4 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-heading font-bold text-xs uppercase italic flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
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

      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<HomePage openRegistration={openRegistration} lang={lang} t={t} />} />
          <Route path="/dich-vu" element={<ServicesPage lang={lang} t={t} openRegistration={openRegistration} isServicesLoading={isServicesLoading} icons={[<Dumbbell size={32} className="text-brand-orange" />, <Calendar size={32} className="text-brand-orange" />, <Users size={32} className="text-brand-orange" />]} />} />
          <Route path="/khuyen-mai" element={<SpecialsPage lang={lang} t={t} openRegistration={openRegistration} />} />
          <Route path="/khach-hang" element={<ReviewsPage lang={lang} t={t} openRegistration={openRegistration} reviews={reviews} fbReviews={fbReviews} tiktokVideos={tiktokVideos} showAllClips={showAllClips} setShowAllClips={setShowAllClips} isAutoPlayEnabled={isAutoPlayEnabled} setIsAutoPlayEnabled={setIsAutoPlayEnabled} setSelectedVideoModal={setSelectedVideoModal} loadingReviews={loadingReviews} getGoogleReviewText={getGoogleReviewText} getGoogleReviewTime={getGoogleReviewTime} getFacebookAuthor={getFacebookAuthor} getFacebookReviewText={getFacebookReviewText} fallbackThumbnails={fallbackThumbnails} />} />
          <Route path="/tin-tuc" element={<NewsPage lang={lang} />} />
          <Route path="/lien-he" element={<ContactPage lang={lang} t={t} openRegistration={openRegistration} />} />
        </Routes>
      </main>
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

              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed text-justify text-pretty">
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
              <div className="pt-4 flex items-center gap-4 text-slate-400">
                <a href="https://www.facebook.com/theshinefitness" target="_blank" rel="noreferrer" className="hover:text-brand-orange transition-colors"><Facebook size={20} /></a>
                <a href="https://www.tiktok.com/@the.shine.fitness" target="_blank" rel="noreferrer" className="hover:text-brand-orange transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                </a>
                <a href="https://zalo.me/0946293593" target="_blank" rel="noreferrer" className="hover:text-brand-orange transition-colors font-bold text-sm">Zalo</a>
              </div>

            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white text-balance">
                {t.footer.quickLinks}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="/dich-vu" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/dich-vu"); }} className="hover:text-brand-orange transition-colors">{t.nav.services}</a></li>
                <li><a href="/khuyen-mai" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khuyen-mai"); }} className="hover:text-brand-orange transition-colors">{t.nav.specials}</a></li>
                
                <li><a href="/khach-hang" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khach-hang"); }} className="hover:text-brand-orange transition-colors">{t.nav.reviews}</a></li>
                <li><a href="#tiktok" className="hover:text-brand-orange transition-colors">{t.nav.tiktok}</a></li>
                <li><a href="/lien-he" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/lien-he"); }} className="hover:text-brand-orange transition-colors">{t.nav.contact}</a></li>
              </ul>
            </div>

            {/* Address & Hours */}
            <div className="lg:col-span-4 space-y-3 text-xs text-slate-400">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white text-balance">
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
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-brand-orange shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{lang === 'vi' ? 'Giờ mở cửa:' : 'Opening Hours:'}</span>
                  <span className="text-slate-300 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-brand-orange"></span> {lang === 'vi' ? 'T2 - T7 (06:00 - 21:00)' : 'Mon - Sat (06:00 - 21:00)'}</span>
                  <span className="text-slate-300 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-brand-orange"></span> {lang === 'vi' ? 'CN (06:00 - 20:30)' : 'Sun (06:00 - 20:30)'}</span>
                </div>
              </div>
              <p className="flex items-start gap-2">
                <Phone size={16} className="text-brand-orange shrink-0 mt-0.5" />
                <span>{t.footer.hotline}</span>
              </p>
              
              <div className="w-full h-40 mt-5 rounded-xl overflow-hidden border border-slate-700/50 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
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
        onToggle={setIsChatbotOpen}
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
        onSuccessSubmit={setToastMessage}
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

      
      {/* Floating Social Bar */}
      <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 p-2 transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <a href="https://www.facebook.com/theshinefitness" target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <Facebook size={20} />
        </a>
        <a href="https://www.tiktok.com/@the.shine.fitness" target="_blank" rel="noreferrer" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
        </a>
        <a href="https://zalo.me/0946293593" target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <span className="font-bold text-xs">Zalo</span>
        </a>
      </div>


      {/* Mobile Floating Action Button (FAB) */}
      <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-fit min-w-[220px] transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button
          onClick={() => openRegistration()}
          className="w-full h-[56px] bg-brand-orange hover:bg-orange-600 text-white px-6 rounded-full font-heading font-bold text-base uppercase italic shadow-[0_4px_15px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
        >
          <Calendar size={20} />
          {lang === 'vi' ? 'Đăng Ký Tập Thử' : 'Book Trial'}
        </button>
      </div>

      <ScrollToTop />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
