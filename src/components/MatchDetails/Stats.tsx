import React, { useState, useEffect } from 'react';
import { Shirt, Shield, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import type { Match } from '../../types';
import { supabase } from '../../lib/supabase';

interface StatsProps {
    match: Match;
}

interface TeamKitDisplay {
    id: string;
    type: 'outfield' | 'gk';
    name: string;
    description: string;
    primaryBg: string;
    stripeColor: string | null;
    accentColor: string;
    collarColor: string;
    imageUrl?: string;
}

export const Stats: React.FC<StatsProps> = ({ match }) => {
    const { teamA, teamB } = match;
    const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

    const [kitsA, setKitsA] = useState<{ outfield: TeamKitDisplay; gk: TeamKitDisplay }>({
        outfield: {
            id: 'home',
            type: 'outfield',
            name: `${teamA.name} Home Kit`,
            description: 'Official primary home colors selected for regulation fixture play.',
            primaryBg: teamA.colorCode || '#ff0046',
            stripeColor: null,
            accentColor: '#ffffff',
            collarColor: '#ffffff',
            imageUrl: undefined,
        },
        gk: {
            id: 'gk',
            type: 'gk',
            name: `${teamA.name} Goalkeeper Kit`,
            description: 'High-visibility goalkeeper jersey engineered for reach and pitch clarity.',
            primaryBg: '#F43F5E',
            stripeColor: null,
            accentColor: '#ffffff',
            collarColor: '#111827',
            imageUrl: undefined,
        },
    });

    const [kitsB, setKitsB] = useState<{ outfield: TeamKitDisplay; gk: TeamKitDisplay }>({
        outfield: {
            id: 'away',
            type: 'outfield',
            name: `${teamB.name} Away Kit`,
            description: 'Official alternate away colors selected to guarantee high television contrast.',
            primaryBg: teamB.colorCode || '#1565c0',
            stripeColor: '#0F172A',
            accentColor: '#ffffff',
            collarColor: '#ffffff',
            imageUrl: undefined,
        },
        gk: {
            id: 'gk',
            type: 'gk',
            name: `${teamB.name} Goalkeeper Kit`,
            description: 'High-contrast goalkeeper jersey chosen for maximum pitch visibility.',
            primaryBg: '#10B981',
            stripeColor: null,
            accentColor: '#ffffff',
            collarColor: '#111827',
            imageUrl: undefined,
        },
    });

    useEffect(() => {
        let isMounted = true;

        const getValidUploadedImageUrl = (url?: string | null): string | undefined => {
            if (!url) return undefined;
            const trimmed = url.trim();
            if (!trimmed || trimmed.includes('images.unsplash.com')) return undefined;
            return trimmed;
        };

        const applyKitsA = (kitsList: any[]) => {
            if (!Array.isArray(kitsList) || kitsList.length === 0) return;
            const homeKit = kitsList.find((k: any) => k.id === 'home') || kitsList[0];
            const gkKit = kitsList.find((k: any) => k.id === 'gk') || kitsList.find((k: any) => k.id === 'third');

            if (homeKit) {
                setKitsA((prev) => ({
                    ...prev,
                    outfield: {
                        ...prev.outfield,
                        name: homeKit.name || prev.outfield.name,
                        description: homeKit.description || prev.outfield.description,
                        primaryBg: homeKit.primaryBg || prev.outfield.primaryBg,
                        stripeColor: homeKit.stripeColor || null,
                        accentColor: homeKit.accentColor || prev.outfield.accentColor,
                        collarColor: homeKit.collarColor || prev.outfield.collarColor,
                        imageUrl: getValidUploadedImageUrl(homeKit.imageUrl),
                    },
                }));
            }
            if (gkKit) {
                setKitsA((prev) => ({
                    ...prev,
                    gk: {
                        ...prev.gk,
                        name: gkKit.name || prev.gk.name,
                        description: gkKit.description || prev.gk.description,
                        primaryBg: gkKit.primaryBg || prev.gk.primaryBg,
                        stripeColor: gkKit.stripeColor || null,
                        accentColor: gkKit.accentColor || prev.gk.accentColor,
                        collarColor: gkKit.collarColor || prev.gk.collarColor,
                        imageUrl: getValidUploadedImageUrl(gkKit.imageUrl),
                    },
                }));
            }
        };

        const applyKitsB = (kitsList: any[]) => {
            if (!Array.isArray(kitsList) || kitsList.length === 0) return;
            const awayKit = kitsList.find((k: any) => k.id === 'away') || kitsList.find((k: any) => k.id === 'third') || kitsList[0];
            const gkKit = kitsList.find((k: any) => k.id === 'gk');

            if (awayKit) {
                setKitsB((prev) => ({
                    ...prev,
                    outfield: {
                        ...prev.outfield,
                        name: awayKit.name || prev.outfield.name,
                        description: awayKit.description || prev.outfield.description,
                        primaryBg: awayKit.primaryBg || prev.outfield.primaryBg,
                        stripeColor: awayKit.stripeColor || null,
                        accentColor: awayKit.accentColor || prev.outfield.accentColor,
                        collarColor: awayKit.collarColor || prev.outfield.collarColor,
                        imageUrl: getValidUploadedImageUrl(awayKit.imageUrl),
                    },
                }));
            }
            if (gkKit) {
                setKitsB((prev) => ({
                    ...prev,
                    gk: {
                        ...prev.gk,
                        name: gkKit.name || prev.gk.name,
                        description: gkKit.description || prev.gk.description,
                        primaryBg: gkKit.primaryBg || prev.gk.primaryBg,
                        stripeColor: gkKit.stripeColor || null,
                        accentColor: gkKit.accentColor || prev.gk.accentColor,
                        collarColor: gkKit.collarColor || prev.gk.collarColor,
                        imageUrl: getValidUploadedImageUrl(gkKit.imageUrl),
                    },
                }));
            }
        };

        // 1. Immediately apply from match object if present
        if (teamA.kits_config && teamA.kits_config.length > 0) {
            applyKitsA(teamA.kits_config);
        }
        if (teamB.kits_config && teamB.kits_config.length > 0) {
            applyKitsB(teamB.kits_config);
        }

        // 2. Query DB to ensure latest uploaded kit assets
        const fetchKits = async () => {
            try {
                const { data, error } = await supabase
                    .from('teams')
                    .select('id, name, color_code, kits_config')
                    .in('id', [teamA.id, teamB.id]);

                if (!isMounted || error || !data) return;

                const teamARec = data.find((t) => t.id === teamA.id);
                const teamBRec = data.find((t) => t.id === teamB.id);

                if (teamARec?.kits_config) applyKitsA(teamARec.kits_config);
                if (teamBRec?.kits_config) applyKitsB(teamBRec.kits_config);
            } catch (err) {
                console.error('Error loading team kits:', err);
            }
        };

        fetchKits();

        return () => {
            isMounted = false;
        };
    }, [teamA.id, teamB.id, teamA.kits_config, teamB.kits_config]);

    const renderKitCard = (kit: TeamKitDisplay, teamName: string, teamLogo: string, isGK: boolean) => {
        return (
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs flex flex-col">
                {/* Kit Header */}
                <div className="px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <img src={teamLogo} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {teamName}
                        </span>
                    </div>
                    <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-xs tracking-wider shrink-0 ${
                            isGK
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                    >
                        {isGK ? 'GOALKEEPER JERSEY' : 'OUTFIELD JERSEY'}
                    </span>
                </div>

                {/* Kit Image / Visual Showcase */}
                <div className="relative w-full aspect-video bg-slate-950/80 overflow-hidden flex items-center justify-center p-4">
                    {kit.imageUrl && !brokenImages[kit.id] ? (
                        <img
                            src={kit.imageUrl}
                            alt={kit.name}
                            className="w-full h-full object-cover object-center transition-transform hover:scale-105 duration-300"
                            onError={() => setBrokenImages((prev) => ({ ...prev, [kit.id]: true }))}
                        />
                    ) : (
                        <div className="relative flex flex-col items-center justify-center">
                            <div
                                className="w-24 h-28 rounded-t-2xl shadow-xl flex items-center justify-center relative overflow-hidden"
                                style={{ backgroundColor: kit.primaryBg }}
                            >
                                <div
                                    className="absolute top-0 w-10 h-3 rounded-b-md"
                                    style={{ backgroundColor: kit.collarColor || '#ffffff' }}
                                />
                                {kit.stripeColor && (
                                    <div
                                        className="w-4 h-full absolute"
                                        style={{ backgroundColor: kit.stripeColor }}
                                    />
                                )}
                                <Shirt className="w-10 h-10 text-white/90 z-10" />
                            </div>
                        </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-black uppercase px-2 py-1 rounded-xs flex items-center gap-1.5 shadow-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Selected for Match</span>
                    </div>

                    <div
                        className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold text-white shadow-md border border-white/20"
                        style={{ backgroundColor: kit.primaryBg }}
                    >
                        {kit.primaryBg}
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {kit.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {kit.description}
                        </p>
                    </div>

                    {/* Color Swatch Specs */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-400 uppercase">Colors:</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: kit.primaryBg }} />
                                <span className="font-mono text-slate-600 dark:text-slate-300">Base</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: kit.accentColor }} />
                                <span className="font-mono text-slate-600 dark:text-slate-300">Accent</span>
                            </div>
                            {kit.collarColor && (
                                <div className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: kit.collarColor }} />
                                    <span className="font-mono text-slate-600 dark:text-slate-300">Collar</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-6">
            {/* MATCHDAY UNIFORM VERIFICATION BANNER */}
            <div className="px-4 py-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-[#ff0046]" />
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                        MATCHDAY KITS & UNIFORMS
                    </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Officials Kit Contrast Approved
                </span>
            </div>

            {/* 1. HOME TEAM KITS: OUTFIELD & GOALKEEPER */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 dark:text-white">
                    <img src={teamA.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                    <span>{teamA.name} • Selected Matchday Kits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderKitCard(kitsA.outfield, teamA.name, teamA.logo, false)}
                    {renderKitCard(kitsA.gk, teamA.name, teamA.logo, true)}
                </div>
            </div>

            {/* 2. AWAY TEAM KITS: OUTFIELD & GOALKEEPER */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 dark:text-white">
                    <img src={teamB.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                    <span>{teamB.name} • Selected Matchday Kits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderKitCard(kitsB.outfield, teamB.name, teamB.logo, false)}
                    {renderKitCard(kitsB.gk, teamB.name, teamB.logo, true)}
                </div>
            </div>
        </div>
    );
};


