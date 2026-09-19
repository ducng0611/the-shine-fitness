import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { GymFloorPlan } from '../components/GymFloorPlan';
import { Star, Quote, Play, ChevronDown, ChevronUp, Video, MapPin, Facebook, MessageCircle } from 'lucide-react';

export const ReviewsPage = ({ 
  lang, 
  t, 
  openRegistration,
  reviews, 
  fbReviews, 
  tiktokVideos, 
  showAllClips, 
  setShowAllClips, 
  isAutoPlayEnabled, 
  setIsAutoPlayEnabled, 
  setSelectedVideoModal, 
  loadingReviews, 
  getGoogleReviewText, 
  getGoogleReviewTime, 
  getFacebookAuthor, 
  getFacebookReviewText, 
  fallbackThumbnails 
}) => {
  return (
    <div className="pt-20">
      {/* Sơ đồ phòng tập tương tác 2 tầng chuẩn 5 sao */}
      <GymFloorPlan lang={lang} onOpenRegistration={() => openRegistration?.('Tập thử trải nghiệm')} />

      <section id="reviews" className="py-20 sm:py-28 bg-slate-100 dark:bg-[#171717] transition-colors duration-200 border-t border-slate-200 dark:border-white/10">
        <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-sm uppercase tracking-widest block mb-2">
              {t.reviews.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight text-balance">
              {t.reviews.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed text-justify text-pretty max-w-3xl mx-auto px-6 sm:px-12 md:px-16">
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
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white uppercase italic text-balance">
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
                          <p className="text-slate-700 dark:text-slate-300 italic text-base leading-relaxed mb-6 line-clamp-4 text-justify text-pretty">
                            "{getGoogleReviewText(rev, lang)}"
                          </p>
                        </div>
                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                          <div className="w-10 h-10 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold text-sm">
                            {rev.authorName?.charAt(0) || 'K'}
                          </div>
                          <div>
                            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
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
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white uppercase italic text-balance">
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
                            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                              {getFacebookAuthor(rev.author, lang)}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base italic leading-relaxed line-clamp-4 text-justify text-pretty">
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
        </FadeIn>
      </section>

      {/* 8. TIKTOK CHANNELS SECTION (Top 3 comments & thumbnails preserved!) */}
      <section id="tiktok" className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors duration-200">
        <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-sm uppercase tracking-widest block mb-2">
              {t.tiktok.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight text-balance">
              {t.tiktok.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed mb-6 text-justify text-pretty max-w-3xl mx-auto px-6 sm:px-12 md:px-16">
              {t.tiktok.sub}
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'vi' ? 'Tự động phát video' : 'Auto-play videos'}
              </span>
              <button
                type="button"
                onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  isAutoPlayEnabled ? 'bg-brand-orange' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-label={lang === 'vi' ? 'Bật/tắt tự động phát' : 'Toggle auto-play'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAutoPlayEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
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
                          {isAutoPlayEnabled ? (
                            <video
                              autoPlay
                              muted
                              loop
                              playsInline
                              poster={video.thumbnail || fallbackThumbnails[i % fallbackThumbnails.length]}
                              src={[
                                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
                                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
                              ][Math.abs(video.caption.length) % 3]}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <img 
                              src={video.thumbnail || fallbackThumbnails[i % fallbackThumbnails.length]} 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              alt={lang === 'en' ? (video.captionEn || video.caption) : (video.captionVi || video.caption)} 
                              onError={(e) => {
                                e.currentTarget.src = fallbackThumbnails[i % fallbackThumbnails.length];
                              }} 
                            />
                          )}
                          {!isAutoPlayEnabled && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/70 transition-colors" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 group-hover:text-brand-orange transition-colors">
                                <div className="w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play size={20} className="fill-white translate-x-0.5" />
                                </div>
                                <span className="mt-2.5 text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white/90 px-3 py-1 rounded-full border border-white/20 backdrop-blur-xs">
                                  {t.tiktok.viewOnTiktok}
                                </span>
                              </div>
                            </>
                          )}
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
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 line-clamp-3 mb-4 italic leading-relaxed text-justify text-pretty">
                        "{lang === 'en' ? (video.captionEn || video.caption) : (video.captionVi || video.caption)}"
                      </p>

                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-white/5 pb-2">
                        <h4 className="text-brand-orange font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-balance">
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
                              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pl-5 text-justify text-pretty">
                                "{lang === 'en' ? (comment.commentEn || comment.comment) : (comment.commentVi || comment.comment)}"
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 text-sm italic p-4 text-center">
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
        </FadeIn>
      </section>

      
    </div>
  );
};
