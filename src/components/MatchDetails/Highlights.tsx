import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw, Clock, ExternalLink } from 'lucide-react';
import type { Match } from '../../types';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

interface HighlightsProps {
    match: Match;
}

export const Highlights: React.FC<HighlightsProps> = ({ match }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(80);
    const [currentTime, setCurrentTime] = useState('0:00');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev + 0.5;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(() => {
        // Convert progress percentage to fake current time (total highlights duration = 4m 15s = 255s)
        const totalSeconds = 255;
        const currentSeconds = Math.floor((progress / 100) * totalSeconds);
        const mins = Math.floor(currentSeconds / 60);
        const secs = currentSeconds % 60;
        setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }, [progress]);

    const handlePlayToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPlaying(!isPlaying);
    };

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        setProgress(0);
        setIsPlaying(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none flex flex-col gap-5">
            {/* Aspect Video Pitch highlights */}
            <div
                onClick={() => setIsPlaying(!isPlaying)}
                className="relative aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 bg-gray-900 group cursor-pointer"
            >

                {isPlaying ? (
                    // Simulated Active Video Stream
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                        {/* Visualizer bars to simulate motion */}
                        <div className="flex items-center gap-1.5 h-16 pointer-events-none">
                            <span className={`w-1 bg-emerald-500 rounded-full h-12 ${isPlaying ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }} />
                            <span className={`w-1 bg-emerald-400 rounded-full h-8 ${isPlaying ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.2s' }} />
                            <span className={`w-1 bg-emerald-500 rounded-full h-14 ${isPlaying ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.3s' }} />
                            <span className={`w-1 bg-teal-400 rounded-full h-10 ${isPlaying ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.4s' }} />
                            <span className={`w-1 bg-emerald-600 rounded-full h-6 ${isPlaying ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.5s' }} />
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-xs font-bold text-white tracking-widest uppercase bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/35">
                                Simulating Video Playback
                            </p>
                        </div>

                        {/* Video Controls overlay (bottom) */}
                        <div
                            className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/90 to-transparent flex flex-col gap-2"
                            onClick={(e) => e.stopPropagation()} // Stop bubbling up
                        >
                            {/* Slider */}
                            <div
                                className="w-full h-1 bg-gray-700/60 rounded-full cursor-pointer relative"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const pct = (x / rect.width) * 100;
                                    setProgress(pct);
                                }}
                            >
                                <div
                                    className="h-full bg-emerald-500 rounded-full relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border border-emerald-600 rounded-full scale-100 group-hover:scale-110" />
                                </div>
                            </div>

                            {/* Lower controls bar */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <button
                                        type="button"
                                        onClick={handlePlayToggle}
                                        className="p-1 rounded-full text-white hover:text-emerald-400 transition-colors"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="p-1 rounded-full text-gray-400 hover:text-white transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>

                                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                                        {currentTime} / 4:15
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-gray-300" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => setVolume(Number(e.target.value))}
                                        className="w-12 h-1 bg-gray-700/40 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Video Thumbnail Wrapper
                    <>
                        {/* Visual background image of pitch */}
                        <img
                            src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600"
                            alt="Match highlights poster"
                            className="w-full h-full object-cover brightness-50 contrast-110 group-hover:scale-103 transition-transform duration-500"
                        />

                        {/* Play Button Overlay (Glassmorphism circle) */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-2xl group-hover:scale-110 active:scale-95 transition-all duration-300">
                                <Play className="w-8 h-8 fill-white translate-x-0.5" />
                            </div>
                        </div>

                        {/* Duration Tag */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/80 px-2 py-1 rounded text-[10px] text-white font-bold tracking-wider">
                            <Clock className="w-3.5 h-3.5" />
                            <span>04:15</span>
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute top-3 left-3 right-3 max-w-[85%] bg-black/55 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/5 text-white">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-450 block">Highlight Reel</span>
                            <h4 className="text-xs font-black truncate">
                                {match.teamA.shortName} vs {match.teamB.shortName} - Goal highlights & cards reports
                            </h4>
                        </div>
                    </>
                )}
            </div>

            {/* External platform quick launch options (to verify Youtube integration mockup) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-150 dark:border-gray-805 transition-colors">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Alternative Stream</span>
                    <h5 className="text-xs font-bold text-gray-850 dark:text-gray-250 flex items-center gap-1">
                        <YoutubeIcon className="w-4 h-4 text-red-500" />
                        Watch on Egerton Sports YouTube Channel
                    </h5>
                </div>

                <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-bold text-[10px] text-emerald-600 dark:text-emerald-500 hover:underline hover:scale-102 transition-transform"
                >
                    <span>Launch Player</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
};
