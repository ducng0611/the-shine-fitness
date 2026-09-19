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
  Car,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ZoneId = 'parking' | 'reception' | 'cardio' | 'freeweights' | 'machines' | 'boxing' | 'yoga' | 'locker';
type FloorId = 'floor1' | 'floor2';

interface GymFloorPlanProps {
  lang: Language;
  onOpenRegistration?: () => void;
}

export function GymFloorPlan({ lang, onOpenRegistration }: GymFloorPlanProps) {
  const t = translations[lang].floorPlan;
  const [activeFloor, setActiveFloor] = useState<FloorId>('floor2');
  const [activeZone, setActiveZone] = useState<ZoneId | null>('cardio');
  const [imageIndex, setImageIndex] = useState(0);

  const zoneData: Record<ZoneId, { icon: React.ReactNode; color: string; floor: FloorId; images: string[] }> = {
    // Tầng 1
    parking: { icon: <Car size={24} />, color: 'bg-stone-500/20 text-stone-400 border-stone-500/30', floor: 'floor1', images: ['/img/parking-space.png'] },
    reception: { icon: <Coffee size={24} />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', floor: 'floor1', images: ['/img/reception.jpg'] },
    // Tầng 2
    cardio: { icon: <HeartPulse size={24} />, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', floor: 'floor2', images: ['/img/cardio-1.png', '/img/cardio-2.png', '/img/cardio-3.png'] },
    freeweights: { icon: <Dumbbell size={24} />, color: 'bg-brand-orange/20 text-brand-orange border-brand-orange/30', floor: 'floor2', images: ['/img/free-weights.png'] },
    machines: { icon: <Activity size={24} />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', floor: 'floor2', images: ['/img/machine.png'] },
    boxing: { icon: <Crosshair size={24} />, color: 'bg-red-500/20 text-red-400 border-red-500/30', floor: 'floor2', images: ['/img/boxing-1.png', '/img/boxing-2.png'] },
    yoga: { icon: <Wind size={24} />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', floor: 'floor2', images: ['/img/yoga.png'] },
    locker: { icon: <Lock size={24} />, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', floor: 'floor2', images: ['/img/restroom-1.png', '/img/restroom-2.png'] }
  };

  const floor1Zones: ZoneId[] = ['parking', 'reception'];
  const floor2Zones: ZoneId[] = ['cardio', 'freeweights', 'machines', 'boxing', 'yoga', 'locker'];

  const currentZones = activeFloor === 'floor1' ? floor1Zones : floor2Zones;

  const handleZoneClick = (zone: ZoneId) => {
    setActiveZone(zone);
    setImageIndex(0); // Reset image index on zone change
  };

  if (activeZone && zoneData[activeZone].floor !== activeFloor) {
    handleZoneClick(activeFloor === 'floor1' ? 'reception' : 'cardio');
  }

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

  const getZoneShortName = (zone: ZoneId) => {
    if (lang === 'vi') {
      switch (zone) {
        case 'parking': return 'Bãi Giữ Xe';
        case 'reception': return 'Lễ Tân';
        case 'cardio': return 'Cardio';
        case 'freeweights': return 'Tạ Tự Do';
        case 'machines': return 'Máy Kháng Lực';
        case 'boxing': return 'Boxing';
        case 'yoga': return 'Yoga';
        case 'locker': return 'Thay Đồ';
      }
    } else {
      switch (zone) {
        case 'parking': return 'Parking';
        case 'reception': return 'Reception';
        case 'cardio': return 'Cardio';
        case 'freeweights': return 'Free Weights';
        case 'machines': return 'Machines';
        case 'boxing': return 'Boxing';
        case 'yoga': return 'Yoga';
        case 'locker': return 'Locker';
      }
    }
  };

  const currentImages = activeZone ? zoneData[activeZone].images : [];

  const nextImage = () => {
    setImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setImageIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1));
  };

  return (
    <section id="floor-plan" className="py-24 bg-slate-50 dark:bg-[#0a0a0a] relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-6xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
            {t.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-xl">
            {t.subtitle}
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-1.5 shadow-xl">
            <button
              onClick={() => setActiveFloor('floor1')}
              className={`px-10 py-4 rounded-xl font-heading font-bold text-lg sm:text-xl uppercase tracking-wider transition-all duration-300 ${
                activeFloor === 'floor1' 
                  ? 'bg-brand-orange text-white shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {t.groundFloor}
            </button>
            <button
              onClick={() => setActiveFloor('floor2')}
              className={`px-10 py-4 rounded-xl font-heading font-bold text-lg sm:text-xl uppercase tracking-wider transition-all duration-300 ${
                activeFloor === 'floor2' 
                  ? 'bg-brand-orange text-white shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {t.firstFloor}
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex-1 w-full flex flex-col relative group">
            <div className="w-full aspect-[4/3] md:aspect-video bg-slate-900 rounded-3xl border-2 border-white/10 overflow-hidden shadow-2xl relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeZone ? activeZone + imageIndex : activeFloor}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full relative"
                >
                  {currentImages.length > 0 ? (
                    <img 
                      src={currentImages[imageIndex]}
                      alt={activeZone ? getZoneTranslation(activeZone).name : ''}
                      className={`w-full h-full opacity-90 transition-all duration-500 ${
                        activeZone === 'parking' ? 'object-contain bg-black/40 scale-90' : 'object-cover'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      No Image Available
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                  
                  {activeZone && (
                    <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold px-5 py-3 rounded-xl text-base uppercase tracking-wider flex items-center gap-2 shadow-xl">
                      <span className={`w-3 h-3 rounded-full ${activeFloor === 'floor1' ? 'bg-emerald-500' : 'bg-brand-orange'} animate-pulse`} />
                      {getZoneTranslation(activeZone).name.toUpperCase()}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {currentImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    aria-label="Previous Image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 border border-white/25 text-white rounded-full backdrop-blur-md transition-all shadow-xl z-20 cursor-pointer"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button 
                    onClick={nextImage}
                    aria-label="Next Image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 border border-white/25 text-white rounded-full backdrop-blur-md transition-all shadow-xl z-20 cursor-pointer"
                  >
                    <ChevronRight size={26} />
                  </button>
                  
                  {/* Visual Image Thumbnails Strip */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 p-1.5 bg-black/65 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl z-20 max-w-[92%] overflow-x-auto">
                    {currentImages.map((imgSrc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageIndex(idx);
                        }}
                        className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 transition-all duration-200 border-2 cursor-pointer ${
                          idx === imageIndex 
                            ? 'border-brand-orange ring-2 ring-brand-orange/60 scale-105 shadow-lg' 
                            : 'border-white/30 opacity-70 hover:opacity-100 hover:border-white'
                        }`}
                      >
                        <img 
                          src={imgSrc} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-black/70 px-1 rounded">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Workout Zone Thumbnails Grid */}
            <div className={`grid gap-4 mt-6 ${currentZones.length === 2 ? 'grid-cols-2 max-w-xl mx-auto w-full' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
              {currentZones.map((zone) => {
                const isActive = activeZone === zone;
                const zoneInfo = getZoneTranslation(zone);
                const thumbImg = zoneData[zone].images[0];
                const imageCount = zoneData[zone].images.length;

                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => handleZoneClick(zone)}
                    className={`
                      relative group transition-all duration-300 rounded-2xl border overflow-hidden
                      flex flex-col text-left shadow-md cursor-pointer
                      ${isActive 
                        ? 'ring-2 ring-brand-orange border-brand-orange scale-[1.03] shadow-xl shadow-brand-orange/20 z-10' 
                        : 'border-slate-200 dark:border-white/10 hover:border-brand-orange/60 hover:shadow-lg bg-slate-900'
                      }
                    `}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950">
                      <img
                        src={thumbImg}
                        alt={zoneInfo.name}
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${
                          zone === 'parking' ? 'object-contain p-2 bg-slate-950' : 'object-cover'
                        }`}
                      />
                      {/* Gradient overlay for readability */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity ${isActive ? 'opacity-70' : 'opacity-80 group-hover:opacity-60'}`} />

                      {/* Top Badges */}
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                        <span className={`p-1.5 rounded-lg backdrop-blur-md border border-white/20 shadow-xs ${isActive ? 'bg-brand-orange text-white' : 'bg-black/60 text-white'}`}>
                          <span className="scale-75 origin-center block">
                            {zoneData[zone].icon}
                          </span>
                        </span>
                        {imageCount > 1 && (
                          <span className="text-[10px] font-bold bg-black/70 backdrop-blur-md text-white/90 px-1.5 py-0.5 rounded-md border border-white/15 flex items-center gap-1 shadow-xs">
                            <Camera size={10} />
                            {imageCount}
                          </span>
                        )}
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute bottom-2 right-2 pointer-events-none">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-orange text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            {lang === 'vi' ? 'Đang xem' : 'Active'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Zone Info Footer - Only name, no subtitle */}
                    <div className={`py-2.5 px-2 text-center transition-colors flex items-center justify-center min-h-[44px] ${
                      isActive 
                        ? 'bg-orange-500/15 dark:bg-orange-500/20' 
                        : 'bg-white dark:bg-slate-900'
                    }`}>
                      <h4 className="font-heading font-bold uppercase tracking-wider text-xs sm:text-[13px] leading-snug text-slate-900 dark:text-white group-hover:text-brand-orange transition-colors line-clamp-2">
                        {getZoneShortName(zone)}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full xl:w-[450px] shrink-0 flex">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl w-full flex flex-col">
              <AnimatePresence mode="wait">
                {activeZone && (
                  <motion.div
                    key={activeZone}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`inline-flex p-4 rounded-2xl ${zoneData[activeZone].color}`}>
                        {zoneData[activeZone].icon}
                      </div>
                      <h3 className="text-3xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {getZoneTranslation(activeZone).name}
                      </h3>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                      {getZoneTranslation(activeZone).desc}
                    </p>
                    
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5 border-b border-slate-200 dark:border-white/10 pb-3">
                        {lang === 'vi' ? 'Chi Tiết & Thiết Bị' : 'Details & Equipment'}
                      </h4>
                      <ul className="space-y-4">
                        {getZoneTranslation(activeZone).equipment.map((item: string, index: number) => (
                          <li key={index} className="flex items-center gap-4 text-slate-700 dark:text-slate-200 text-lg">
                            <div className={`w-2 h-2 rounded-full ${zoneData[activeZone].color.split(' ')[1]}`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={() => { if (onOpenRegistration) onOpenRegistration(); }}
                      className="mt-8 w-full py-5 rounded-xl font-heading font-black uppercase tracking-widest text-xl sm:text-2xl bg-brand-orange hover:bg-brand-orange-hover text-white transition-colors flex items-center justify-center gap-3 shadow-lg group"
                    >
                      {lang === 'vi' ? 'Trải Nghiệm Ngay' : 'Experience Now'}
                      <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
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
