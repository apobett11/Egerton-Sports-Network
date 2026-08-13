import React from 'react';
import { Shield, Mail, Award, Activity, Heart, ExternalLink, Globe, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-slate-200/90 dark:bg-[#070A14] text-slate-500 dark:text-slate-400 border-t-2 border-[#D4AF37]/50 dark:border-t-2 dark:border-[#D4AF37]/40 py-12 px-6 mt-auto select-none shadow-2xl relative z-20">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Main 4-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Col 1: Branding */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 font-black text-slate-900 dark:text-slate-100 text-base tracking-tight">
                            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-sm">
                                <Activity className="w-4 h-4" />
                            </div>
                            <span>Egerton Sports Network</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                            The official live scores, fixture scheduling engine, league standings, and athletics portal for Egerton University sports.
                        </p>
                        <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Globe className="w-3.5 h-3.5" />
                            <span>sports.egerton.ac.ke</span>
                        </div>
                    </div>

                    {/* Col 2: Competitions */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                            Competitions
                        </h4>
                        <ul className="space-y-2 text-xs font-medium">
                            <li>
                                <a href="#/scores" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Egerton Premier League</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/scores" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Egerton Championships</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/scores" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Campus Champions Cup</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Useful Links & Governance */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                            Useful Links
                        </h4>
                        <ul className="space-y-2 text-xs font-medium">
                            <li>
                                <a href="#/news" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Official Match Rules</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/home" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Platform Policies & RLS</span>
                                </a>
                            </li>
                            <li>
                                <a href="#/home" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Varsity Health Desk</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Contact & Legal */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                            Contact & Legal
                        </h4>
                        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Egerton Sports Council</p>
                            <p>Njoro Main Campus, Kenya</p>
                            <p className="text-[11px] font-mono text-slate-400">sports@egerton.ac.ke</p>
                        </div>
                        <div className="pt-2 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                            <a href="#/home" className="hover:underline">Privacy Policy</a>
                            <span>•</span>
                            <a href="#/home" className="hover:underline">Terms of Service</a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Version */}
                <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
                    <div>
                        © {new Date().getFullYear()} Egerton Sports Network • All Rights Reserved
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                            v1.0.0 Production
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for Egerton Football
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
