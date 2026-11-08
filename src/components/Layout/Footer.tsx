import React, { useState, useEffect } from 'react';
import { Shield, Mail, Globe, FileText, Info, X, Building2, GraduationCap, Trophy, ExternalLink } from 'lucide-react';
import { EsnLogo } from '../common/EsnLogo';

export const Footer: React.FC = () => {
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsDevModalOpen(false);
            }
        };
        if (isDevModalOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDevModalOpen]);

    return (
        <footer className="w-full bg-white dark:bg-[#0e1e2d] text-slate-600 dark:text-slate-400 border-t border-[#e6e8ec] dark:border-[#14263b] py-8 px-4 sm:px-6 mt-auto select-none transition-colors">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header of Footer: Royal Developers • Kiprotich Bett */}
                <div className="flex flex-wrap items-center justify-center gap-3 border-b border-[#f0f2f5] dark:border-[#14263b] pb-4">
                    <a
                        href="/royaldevelopers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                        title="Developed by Royal Developers (Kiprotich Bett)"
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Developed by Royal Developers • Kiprotich Bett</span>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                    </a>
                    <button
                        type="button"
                        onClick={() => setIsDevModalOpen(true)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer hover:underline focus:outline-hidden"
                        title="About the engineering team"
                    >
                        Engineering Details
                    </button>
                </div>

                {/* Main 4-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
                    {/* Col 1: Branding */}
                    <div className="space-y-2.5">
                        <EsnLogo size="sm" textColor="text-slate-900 dark:text-white" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                            Official live scores, fixture scheduling engine, and standings for Egerton University sports.
                        </p>
                        <div className="pt-1 flex items-center gap-2 text-[11px] font-bold text-[#ff0046]">
                            <Globe className="w-3.5 h-3.5" />
                            <span>sports.egerton.ac.ke</span>
                        </div>
                    </div>

                    {/* Col 2: Competitions */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Competitions
                        </h4>
                        <ul className="space-y-2 text-xs font-medium">
                            <li>
                                <a href="#/home" className="hover:text-[#ff0046] transition-colors flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff0046]" />
                                    <span>Egerton Premier League</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/home" className="hover:text-[#ff0046] transition-colors flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <span>Egerton Championships</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/home" className="hover:text-[#ff0046] transition-colors flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span>Campus Champions Cup</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Useful Links & Legal Policies */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Institutional & Legal
                        </h4>
                        <ul className="space-y-2 text-xs font-medium">
                            <li>
                                <a href="#/news" className="hover:text-[#ff0046] transition-colors flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Match News & Press</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/privacy" className="hover:text-[#ff0046] transition-colors flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Privacy Policy</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/terms" className="hover:text-[#ff0046] transition-colors flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Terms of Service</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/about" className="hover:text-[#ff0046] transition-colors flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                    <span>About ESN Ecosystem</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Contact & Governance */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Contact & Governance
                        </h4>
                        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <p className="font-bold text-slate-800 dark:text-slate-200">Egerton Sports Council</p>
                            <p>Njoro Main Campus, Nakuru, Kenya</p>
                            <a href="#/contact" className="text-[11px] font-bold text-[#ff0046] hover:underline flex items-center gap-1 pt-0.5">
                                <Mail className="w-3.5 h-3.5" />
                                <span>Official Contact & Desk</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Version */}
                <div className="pt-4 border-t border-[#f0f2f5] dark:border-[#14263b] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    <div>
                        © {new Date().getFullYear()} ESN • Egerton Sports Network • Developed &amp; Engineered by{' '}
                        <a
                            href="/royaldevelopers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-slate-800 dark:text-slate-200 hover:text-amber-500 underline transition-colors"
                        >
                            Royal Developers (Kiprotich Bett)
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-xs bg-[#f0f2f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                            ESN Varsity Edition
                        </span>
                        <span>Official Athletics Portal</span>
                    </div>
                </div>
            </div>

            {/* Developer Info Modal */}
            {isDevModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-text animate-in fade-in duration-150"
                    onClick={() => setIsDevModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dev-modal-title"
                >
                    <div
                        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0e1e2d] border border-amber-500/30 rounded-2xl shadow-2xl p-5 text-slate-800 dark:text-slate-200 space-y-4 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#14263b]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-base shadow-xs">
                                    👑
                                </div>
                                <div>
                                    <h3 id="dev-modal-title" className="text-xs font-bold uppercase tracking-wider text-amber-500">
                                        Royal Developers
                                    </h3>
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none mt-0.5">
                                        Kiprotich Bett • Owner &amp; Architect
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDevModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                            <p className="leading-relaxed">
                                <span className="font-bold text-slate-900 dark:text-white">Egerton Sports Network (EgerScore)</span> was envisioned, architected, and engineered by{' '}
                                <span className="font-bold text-amber-500">Royal Developers</span> under founder and principal systems engineer{' '}
                                <span className="font-bold text-slate-900 dark:text-white">Kiprotich Bett</span>.
                            </p>

                            {/* Direct Action Link to Separate Royal Developers Page */}
                            <a
                                href="/royaldevelopers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <span>Visit Royal Developers Official Page</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {/* Projects List */}
                            <div className="pt-1 space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Flagship Works &amp; Platforms
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#14263b]/60 border border-amber-500/20">
                                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-[#ff0046] shrink-0">
                                            <Trophy className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                Egerton Sports Network (EgerScore)
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                Collegiate live scores &amp; fixture engines
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#14263b]/60 border border-slate-100 dark:border-[#1e344d]/60">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                            <Building2 className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                Arena Homes
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                Housing &amp; real estate booking platform
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#14263b]/60 border border-slate-100 dark:border-[#1e344d]/60">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                                            <GraduationCap className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                McMca
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                Ward education &amp; bursary management system
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Close Button */}
                        <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-[#14263b]">
                            <span className="text-[10px] text-slate-400 font-mono">
                                Lead: Kiprotich Bett
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsDevModalOpen(false)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#14263b] dark:hover:bg-[#1c3552] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
};
