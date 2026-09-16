const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace header section
const headerTarget = `<p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.tiktok.sub}
            </p>
          </div>`;

const headerReplacement = `<p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              {t.tiktok.sub}
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'vi' ? 'Tự động phát video' : 'Auto-play videos'}
              </span>
              <button
                type="button"
                onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
                className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 dark:focus:ring-offset-slate-900 \${
                  isAutoPlayEnabled ? 'bg-brand-orange' : 'bg-slate-300 dark:bg-slate-600'
                }\`}
                aria-label={lang === 'vi' ? 'Bật/tắt tự động phát' : 'Toggle auto-play'}
              >
                <span
                  className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                    isAutoPlayEnabled ? 'translate-x-6' : 'translate-x-1'
                  }\`}
                />
              </button>
            </div>
          </div>`;

code = code.replace(headerTarget, headerReplacement);

// Replace video thumbnail
const videoTarget = `<img \n                            src={video.thumbnail || fallbackThumbnails[i % fallbackThumbnails.length]} \n                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" \n                            alt={video.caption} \n                            onError={(e) => {\n                              e.currentTarget.src = fallbackThumbnails[i % fallbackThumbnails.length];\n                            }} \n                          />\n                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/70 transition-colors" />\n                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 group-hover:text-brand-orange transition-colors">\n                            <div className="w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">\n                              <Play size={20} className="fill-white translate-x-0.5" />\n                            </div>\n                            <span className="mt-2.5 text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white/90 px-3 py-1 rounded-full border border-white/20 backdrop-blur-xs">\n                              {t.tiktok.viewOnTiktok}\n                            </span>\n                          </div>`;

const videoReplacement = `{isAutoPlayEnabled ? (
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
                              alt={video.caption} 
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
                          )}`;

code = code.replace(videoTarget, videoReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx Autoplay UI added.');
