import { useState, useEffect } from "react";

export default function LoadingModal({ isLoading }: { isLoading: boolean }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval;

    if (isLoading) {
      setVisible(true);
      setProgress(0);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 95) {
            const increment = Math.random() * 5;
            return Math.min(prev + increment, 95);
          }
          return prev;
        });
      }, 200);
    } else {
      // when loading done
      setProgress(100);
      const timeout = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timeout);
    }

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center rounded-2xl p-8 shadow-xl min-w-[320px] transition-all">
        <p className="text-slate-700 font-medium mb-2">កំពុងផ្ទុក...</p>
        <p className="text-slate-500 text-sm mb-4">{Math.round(progress)}%</p>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r card from-blue-500 to-blue-600 rounded-full transition-[width] duration-200 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 1.5s infinite linear;
          }
        `}</style>
      </div>
    </div>
  );
}
