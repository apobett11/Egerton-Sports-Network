import React from 'react';
import { Shield, Mail, Award, Activity, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-slate-100/90 dark:bg-[#0B0F17] text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80 py-10 px-6 mt-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">
                    {/* Brand Info Column */}
                    <div className="space-y-2 max-w-sm">
                        <div className="flex items-center justify-center md:justify-start gap-2 font-black text-slate-900 dark:text-slate-100 text-base tracking-tight">
                            <div className="p-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                                <Activity className="w-4 h-4" />
                            </div>
                            <span>Egerton Sports Network</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                            The official campus live scores, standings engine, match reporting, and official sports portal for Egerton University athletics.
                        </p>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <a href="#rules" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-md px-1 py-0.5">
                            <Award className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                            <span>Match Rules</span>
                        </a>
                        <a href="#about" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-md px-1 py-0.5">
                            <Shield className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                            <span>Platform Policies</span>
                        </a>
                        <a href="#contact" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-md px-1 py-0.5">
                            <Mail className="w-4 h-4 text-blue-500" aria-hidden="true" />
                            <span>Contact Admin</span>
                        </a>
                    </div>

                    {/* Department & Copyright */}
                    <div className="text-center md:text-right text-xs text-slate-400 space-y-1">
                        <p className="font-extrabold text-slate-700 dark:text-slate-300">
                            © {new Date().getFullYear()} Egerton Sports Network
                        </p>
                        <p className="text-[11px]">Faculty of Arts & Social Sciences</p>
                        <p className="text-[10px] text-slate-500 flex items-center justify-center md:justify-end gap-1">
                            Built with precision for campus football <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
