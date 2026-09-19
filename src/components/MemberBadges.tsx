import React, { useEffect, useState } from 'react';
import { Award, Flame, Sun, Moon, Zap, Trophy, Target, Star, CalendarDays, Crown, CheckCircle2 } from 'lucide-react';
import { getMemberCheckInsFromFirebase, getMemberWorkoutLogsFromFirebase } from '../lib/firebase';
import { Language } from '../translations';
import { MemberUser } from './AuthModal';

interface MemberBadgesProps {
  user: MemberUser;
  lang: Language;
}

export const MemberBadges: React.FC<MemberBadgesProps> = ({ user, lang }) => {
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [fetchedCheckIns, fetchedWorkouts] = await Promise.all([
          getMemberCheckInsFromFirebase(user.memberCode || ''),
          getMemberWorkoutLogsFromFirebase(user.memberCode || '')
        ]);
        setCheckIns(fetchedCheckIns);
        setWorkouts(fetchedWorkouts);
      } catch (err) {
        console.error("Failed to fetch badges data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user.memberCode) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user.memberCode]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2 border-r-transparent"></div>
      </div>
    );
  }

  const checkInCount = checkIns.length;
  const workoutCount = workouts.length;

  const totalSessions = Math.max(checkInCount, workoutCount);

  // Analyze time of workouts/checkins
  let hasEarlyBird = false;
  let hasNightOwl = false;
  
  [...checkIns, ...workouts].forEach(record => {
    const dateStr = record.checkInTime || record.createdAt;
    if (dateStr) {
      try {
        const date = new Date(dateStr);
        const hour = date.getHours();
        if (hour >= 4 && hour <= 8) hasEarlyBird = true;
        if (hour >= 20 || hour <= 2) hasNightOwl = true;
      } catch (e) {}
    }
  });

  const badges = [
    {
      id: 'first-step',
      name: lang === 'vi' ? 'Bước Đầu Tiên' : 'First Step',
      desc: lang === 'vi' ? 'Hoàn thành buổi tập đầu tiên' : 'Completed first session',
      icon: <Target size={24} className="text-emerald-500" />,
      color: 'bg-emerald-500/10 border-emerald-500/30',
      earned: totalSessions >= 1
    },
    {
      id: 'consistency-5',
      name: lang === 'vi' ? 'Đều Đặn 5' : 'Consistency 5',
      desc: lang === 'vi' ? 'Đạt 5 buổi tập' : 'Reached 5 sessions',
      icon: <Flame size={24} className="text-orange-500" />,
      color: 'bg-orange-500/10 border-orange-500/30',
      earned: totalSessions >= 5
    },
    {
      id: 'consistency-king',
      name: lang === 'vi' ? 'Kỷ Luật Vua' : 'Consistency King',
      desc: lang === 'vi' ? 'Đạt 10+ buổi tập' : 'Reached 10+ sessions',
      icon: <Crown size={24} className="text-amber-500" />,
      color: 'bg-amber-500/10 border-amber-500/30',
      earned: totalSessions >= 10
    },
    {
      id: 'early-bird',
      name: lang === 'vi' ? 'Chim Sớm' : 'Early Bird',
      desc: lang === 'vi' ? 'Tập luyện trước 8:00 AM' : 'Workout before 8:00 AM',
      icon: <Sun size={24} className="text-yellow-400" />,
      color: 'bg-yellow-400/10 border-yellow-400/30',
      earned: hasEarlyBird
    },
    {
      id: 'night-owl',
      name: lang === 'vi' ? 'Cú Đêm' : 'Night Owl',
      desc: lang === 'vi' ? 'Tập luyện sau 8:00 PM' : 'Workout after 8:00 PM',
      icon: <Moon size={24} className="text-indigo-400" />,
      color: 'bg-indigo-400/10 border-indigo-400/30',
      earned: hasNightOwl
    },
    {
      id: 'vip-elite',
      name: lang === 'vi' ? 'Hội Viên Elite' : 'Elite Member',
      desc: lang === 'vi' ? 'Đạt 50+ buổi tập' : 'Reached 50+ sessions',
      icon: <Trophy size={24} className="text-purple-500" />,
      color: 'bg-purple-500/10 border-purple-500/30',
      earned: totalSessions >= 50
    }
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
          <Award size={18} className="text-brand-orange" />
          {lang === 'vi' ? 'Huy Hiệu & Thành Tích' : 'Badges & Achievements'}
        </h3>
        <div className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300">
          {lang === 'vi' ? `Tổng buổi tập: ${totalSessions}` : `Total Sessions: ${totalSessions}`}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map(badge => (
          <div 
            key={badge.id}
            className={`relative p-4 rounded-2xl border transition-all ${
              badge.earned 
                ? `${badge.color} opacity-100 scale-100 shadow-sm` 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 opacity-50 grayscale hover:grayscale-0 transition-all duration-300'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-[#1a1a1a] shadow-xs ${badge.earned ? 'shadow-md' : ''}`}>
                {badge.icon}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {badge.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  {badge.desc}
                </div>
              </div>
            </div>
            {badge.earned && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
