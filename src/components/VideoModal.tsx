import React from 'react';
import { X, Play, Heart, Eye, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';
import { Language } from '../translations';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    url: string;
    caption: string;
    views: string | number;
    likes: string | number;
    commentCount: string | number;
    thumbnail?: string;
    comments?: Array<{
      author: string;
      comment: string;
      likes?: number;
      rank?: number;
    }>;
  } | null;
  lang: Language;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  video,
  lang
}) => {
  if (!isOpen || !video) return null;
  const isVi = lang === 'vi';

  // Sample gym exercise workout video URLs
  const sampleWorkoutVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  ];
  const videoSrc = sampleWorkoutVideos[Math.abs(video.caption.length) % sampleWorkoutVideos.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-950 rounded-3xl shadow-2xl border border-white/10 overflow-hidden my-6 flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer border border-white/20"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Video Player Column */}
        <div className="w-full md:w-3/5 bg-black flex flex-col items-center justify-center relative aspect-9/16 md:aspect-auto min-h-[360px] md:min-h-[500px]">
          <video
            controls
            autoPlay
            playsInline
            loop
            poster={video.thumbnail}
            src={videoSrc}
            className="w-full h-full object-contain"
          >
            {isVi ? 'Trình duyệt của bạn không hỗ trợ video.' : 'Your browser does not support the video tag.'}
          </video>
        </div>

        {/* Info & Comments Column */}
        <div className="w-full md:w-2/5 p-6 bg-slate-900 border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between text-white">
          <div className="space-y-4">
            
            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="bg-brand-orange text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                TikTok Community
              </span>
              <span className="text-xs text-slate-400">@theshinefitness</span>
            </div>

            {/* Caption */}
            <h3 className="font-heading font-bold text-base sm:text-lg italic leading-snug line-clamp-3">
              "{video.caption}"
            </h3>

            {/* Stats Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-1">
                <Eye size={15} className="text-brand-orange" />
                <span>{Number(video.views || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={15} className="text-rose-500 fill-rose-500" />
                <span>{Number(video.likes || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={15} className="text-sky-400" />
                <span>{video.commentCount || 0}</span>
              </div>
            </div>

            {/* Top Comments List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                <Sparkles size={14} />
                {isVi ? 'Top 3 Bình luận tiêu biểu' : 'Top 3 Community Comments'}
              </h4>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {video.comments && video.comments.length > 0 ? (
                  video.comments.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                        <span className="text-brand-orange">@{c.author}</span>
                        {c.likes !== undefined && c.likes > 0 && (
                          <span className="text-[10px] text-rose-400">❤️ {c.likes}</span>
                        )}
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        "{c.comment}"
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {isVi ? 'Chưa có bình luận nào.' : 'No comments yet.'}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline uppercase"
            >
              <span>{isVi ? 'Mở trên TikTok' : 'Open in TikTok'}</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase cursor-pointer"
            >
              {isVi ? 'Đóng' : 'Close'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
