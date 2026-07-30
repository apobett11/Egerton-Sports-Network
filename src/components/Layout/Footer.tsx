import React from 'react';
import { Shield, Mail, Award, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 py-6 px-4 mt-auto">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Info Column */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-gray-855 dark:text-gray-200 text-sm">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span>Egerton Sports Network</span>
                    </div>
                    <p className="text-xs max-w-xs text-gray-400 mt-1">
                        The premier campus livescore, news reporting and transfer desk platform for Egerton University sports.
                    </p>
                </div>

                {/* Links Column */}
                <div className="flex items-center gap-6 text-xs font-medium">
                    <a href="#rules" className="hover:text-emerald-550 dark:hover:text-emerald-450 transition-colors flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Rules
                    </a>
                    <a href="#about" className="hover:text-emerald-555 dark:hover:text-emerald-455 transition-colors flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        Policies
                    </a>
                    <a href="#contact" className="hover:text-emerald-555 dark:hover:text-emerald-455 transition-colors flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        Contact
                    </a>
                </div>

                {/* Copyright */}
                <div className="text-center md:text-right text-[10px] text-gray-400">
                    <p>© {new Date().getFullYear()} Egerton Sports Network.</p>
                    <p className="mt-0.5">Faculty of Arts & Sciences Dept. project.</p>
                </div>

            </div>
        </footer>
    );
};
