import React from 'react';
import {
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import type { PlatformInsightItem, AdminTabType } from '../../types';

interface AdminPlatformInsightsViewProps {
  insights: PlatformInsightItem[];
  setActiveTab: (tab: AdminTabType) => void;
}

export const AdminPlatformInsightsView: React.FC<AdminPlatformInsightsViewProps> = ({
  insights,
  setActiveTab,
}) => {
  const getSeverityBadge = (severity: 'critical' | 'warning' | 'info' | 'success') => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertOctagon,
          bgColor: 'bg-rose-950/40',
          borderColor: 'border-rose-800/60',
          textColor: 'text-rose-400',
          badgeText: '🔴 Action Required',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-950/40',
          borderColor: 'border-amber-800/60',
          textColor: 'text-amber-400',
          badgeText: '🟠 Attention Needed',
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-950/40',
          borderColor: 'border-blue-800/60',
          textColor: 'text-blue-400',
          badgeText: '🔵 System Advisory',
        };
      case 'success':
      default:
        return {
          icon: CheckCircle2,
          bgColor: 'bg-emerald-950/40',
          borderColor: 'border-emerald-800/60',
          textColor: 'text-emerald-400',
          badgeText: '🟢 Operational',
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Platform Insights & Operational Highlights
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Actionable operational intelligence highlighting items requiring administrator action.
            </p>
          </div>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-white uppercase">All Systems Operating Normally</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No critical system alerts, moderation flags, or pending operational actions requiring administrator intervention at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((item) => {
            const style = getSeverityBadge(item.severity);
            const Icon = style.icon;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl ${style.bgColor} border ${style.borderColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-[#111111] border ${style.borderColor} ${style.textColor} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${style.textColor}`}>
                        {style.badgeText}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-white">{item.title}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.message}</p>
                  </div>
                </div>

                {item.targetTab && item.actionRequired && (
                  <button
                    onClick={() => setActiveTab(item.targetTab!)}
                    className={`py-2.5 px-4 bg-[#111111] hover:bg-[#1E1E1E] ${style.textColor} font-bold text-xs rounded-xl border ${style.borderColor} transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[44px]`}
                  >
                    <span>{item.actionRequired}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
