import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { 
  Coffee, 
  HeartPulse, 
  Dumbbell, 
  Activity, 
  Wind, 
  Lock,
  ArrowRight,
  ClipboardList,
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ZoneId = 'parking' | 'reception' | 'inbody' | 'cardio' | 'freeweights' | 'machines' | 'yoga' | 'locker';
type FloorId = 'floor1' | 'floor2';

interface GymFloorPlanProps {
  lang: Language;
  onOpenRegistration?: () => void;
}

export function GymFloorPlan({ lang, onOpenRegistration }: GymFloorPlanProps) {
  const t = translations[lang].floorPlan;
  const [activeFloor, setActiveFloor] = useState<FloorId>('floor2');
  const [activeZone, setActiveZone] = useState<ZoneId | null>('cardio');

  // We add 'parking' dynamically here since it wasn't in translations yet, or we use existing ones
  const zoneData: Record<ZoneId, { icon: React.ReactNode; color: string; floor: FloorId }> = {
    // Tầng 1
    parking: { icon: <Car size={24} />, color: 'bg-stone-500/20 text-stone-400 border-stone-500/30', floor: 'floor1' },
    reception: { icon: <Coffee size={24} />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', floor: 'floor1' },
    inbody: { icon: <ClipboardList size={24} />, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', floor: 'floor1' },
    // Tầng 2
    cardio: { icon: <HeartPulse size={24} />, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', floor: 'floor2' },
    freeweights: { icon: <Dumbbell size={24} />, color: 'bg-brand-orange/20 text-brand-orange border-brand-orange/30', floor: 'floor2' },
    machines: { icon: <Activity size={24} />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', floor: 'floor2' },
    yoga: { icon: <Wind size={24} />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', floor: 'floor2' },
    locker: { icon: <Lock size={24} />, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', floor: 'floor2' }
  };

  const floor1Zones: ZoneId[] = ['parking', 'reception', 'inbody'];
  const floor2Zones: ZoneId[] = ['cardio', 'freeweights', 'machines', 'yoga', 'locker'];

  const currentZones = activeFloor === 'floor1' ? floor1Zones : floor2Zones;

  // Ensure activeZone is on the current floor, otherwise reset to the first zone of the floor
  if (activeZone && zoneData[activeZone].floor !== activeFloor) {
    setActiveZone(activeFloor === 'floor1' ? 'reception' : 'cardio');
  }

  // Use a fallback for parking if not in translations
  const getZoneTranslation = (zone: ZoneId) => {
    if (zone === 'parking') {
      return {
        name: lang === 'vi' ? 'Bãi Giữ Xe' : 'Parking Area',
        desc: lang === 'vi' ? 'Khu vực đỗ xe rộng rãi, an ninh 24/7 dành cho hội viên.' : 'Spacious, 24/7 secure parking area for members.',
        equipment: lang === 'vi' ? ['Camera an ninh', 'Bảo vệ trực', 'Mái che'] : ['Security Cameras', 'Guard on duty', 'Covered parking']
      };
    }
    return t.zones[zone as keyof typeof t.zones];
  };

  return (
    <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-heading font-black text-white uppercase tracking-tight mb-4">
            {t.title}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            {t.subtitle}
          </p>
        </div>

        {/* Floor Selection Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-900 border border-white/10 rounded-2xl p-1.5 shadow-xl">
            <button
              onClick={() => setActiveFloor('floor1')}
              className={`px-8 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-300 ${
                activeFloor === 'floor1' 
                  ? 'bg-brand-orange text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.groundFloor}
            </button>
            <button
              onClick={() => setActiveFloor('floor2')}
              className={`px-8 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-300 ${
                activeFloor === 'floor2' 
                  ? 'bg-brand-orange text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.firstFloor}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Visual Floor Plan Image Area */}
          <div className="flex-1 w-full relative group">
            <div className="w-full aspect-[4/3] sm:aspect-video lg:aspect-square xl:aspect-[4/3] bg-slate-900 rounded-3xl border-2 border-white/10 overflow-hidden shadow-2xl relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFloor}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  {/* Using placeholder images to represent the 3D floor plan. 
                      User can replace these src URLs with their actual 3D renders. */}
                  <img 
                    src={activeFloor === 'floor1' 
                      ? "/floor1.jpg" 
                      : "/floor2.jpg" }
                    alt={activeFloor === 'floor1' ? t.groundFloor : t.firstFloor}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Overlay overlay to make it look more like a blueprint/floor plan in the meantime */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                  
                  {/* Badge */}
                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold px-4 py-2 rounded-xl text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl">
                    <span className={`w-2 h-2 rounded-full ${activeFloor === 'floor1' ? 'bg-emerald-500' : 'bg-brand-orange'} animate-pulse`} />
                    {activeFloor === 'floor1' ? t.groundFloor : t.firstFloor}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive Grid of Zones below the image */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
              {currentZones.map((zone) => {
                const isActive = activeZone === zone;
                const zoneInfo = getZoneTranslation(zone);
                return (
                  <button
                    key={zone}
                    onClick={() => setActiveZone(zone)}
                    className={`
                      relative group transition-all duration-300 rounded-xl border
                      flex flex-col items-center justify-center p-3 min-h-[90px] shadow-sm
                      ${isActive 
                        ? `${zoneData[zone].color} scale-105 shadow-xl shadow-black/50 z-10` 
                        : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-200'
                      }
                    `}
                  >
                    <div className={`mb-2 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {zoneData[zone].icon}
                    </div>
                    <span className="font-heading font-bold uppercase tracking-wider text-[10px] md:text-xs text-center leading-tight">
                      {zoneInfo.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sticky top-24 shadow-2xl">
              <AnimatePresence mode="wait">
                {activeZone && (
                  <motion.div
                    key={activeZone}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`inline-flex p-4 rounded-2xl mb-6 ${zoneData[activeZone].color}`}>
                      {zoneData[activeZone].icon}
                    </div>
                    
                    <h3 className="text-2xl font-heading font-bold text-white mb-3">
                      {getZoneTranslation(activeZone).name}
                    </h3>
                    
                    <p className="text-slate-400 mb-8 leading-relaxed">
                      {getZoneTranslation(activeZone).desc}
                    </p>
                    
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                        {lang === 'vi' ? 'Chi Tiết & Thiết Bị' : 'Details & Equipment'}
                      </h4>
                      <ul className="space-y-3">
                        {getZoneTranslation(activeZone).equipment.map((item: string, index: number) => (
                          <li key={index} className="flex items-center gap-3 text-slate-300">
                            <div className={`w-1.5 h-1.5 rounded-full ${zoneData[activeZone].color.split(' ')[1]}`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={() => { if (onOpenRegistration) onOpenRegistration(); }}
                      className="mt-10 w-full py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center justify-center gap-2 group border border-white/5"
                    >
                      {lang === 'vi' ? 'Trải Nghiệm Ngay' : 'Experience Now'}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
