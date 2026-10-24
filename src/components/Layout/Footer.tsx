import React, { useState, useEffect } from 'react';
import { Shield, Mail, Globe, FileText, Info, X, Code2, Building2, GraduationCap, Trophy, Wrench } from 'lucide-react';
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
                {/* Header of Footer: @kibet. link at the top, middle, and blue */}
                <div className="flex justify-center border-b border-[#f0f2f5] dark:border-[#14263b] pb-4">
                    <button
                        type="button"
                        onClick={() => setIsDevModalOpen(true)}
                        className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer hover:underline focus:outline-hidden"
                        title="About the developer"
                    >
                        @kibet.
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
                        © {new Date().getFullYear()} ESN • Egerton Sports Network
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
                        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0e1e2d] border border-slate-200 dark:border-[#1e344d] rounded-2xl shadow-2xl p-5 text-slate-800 dark:text-slate-200 space-y-4 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#14263b]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <Code2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 id="dev-modal-title" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Developer
                                    </h3>
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                                        @kibet.
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
                                <span className="font-semibold text-slate-900 dark:text-white">Kibet</span> is the developer of the{' '}
                                <span className="font-semibold text-[#ff0046]">Egerton Sports Network</span> (EgerScore).
                            </p>

                            {/* Under Maintenance Notice */}
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                                <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>The company website is currently under maintenance.</span>
                            </div>

                            {/* Projects List (minimalistic, premium, icons, no external outgoing links) */}
                            <div className="pt-1 space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Other Developed Websites & Platforms
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#14263b]/60 border border-slate-100 dark:border-[#1e344d]/60">
                                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-[#ff0046] shrink-0">
                                            <Trophy className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                Egerton Sports Network
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                Live scores & fixtures hub
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
                                                Housing & real estate platform
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
                                                Ward education management system
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Close Button */}
                        <div className="pt-1 flex justify-end">
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
