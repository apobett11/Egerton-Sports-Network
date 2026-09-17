import React from 'react';
import { Shield, Mail, Award, Activity, Heart, Globe, FileText, Info } from 'lucide-react';
import { EsnLogo } from '../common/EsnLogo';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-white dark:bg-[#0e1e2d] text-slate-600 dark:text-slate-400 border-t border-[#e6e8ec] dark:border-[#14263b] py-10 px-4 sm:px-6 mt-auto select-none transition-colors">
            <div className="max-w-7xl mx-auto space-y-8">
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
        </footer>
    );
};


