import React from 'react';
import {
  Newspaper,
  Shield,
  Award,
  Crown,
  Eye,
  CheckCircle,
  Clock,
  Megaphone,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type {
  JournalistOverviewSummary,
  TeamOverviewSummary,
  RefereeOverviewSummary,
  PresidentOverviewSummary,
} from '../../types';

interface AdminDashboardOverviewsViewProps {
  journalistOverview: JournalistOverviewSummary;
  teamOverview: TeamOverviewSummary;
  refereeOverview: RefereeOverviewSummary;
  presidentOverview: PresidentOverviewSummary;
  onOpenModal: (type: 'journalist' | 'team' | 'referee' | 'president') => void;
}

export const AdminDashboardOverviewsView: React.FC<AdminDashboardOverviewsViewProps> = ({
  journalistOverview,
  teamOverview,
  refereeOverview,
  presidentOverview,
  onOpenModal,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Role Operations Overviews
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Operational summaries from every role without taking over their specific tasks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. JOURNALIST OVERVIEW CARD */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-purple-500/40 transition-all space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase">Journalist Overview</h3>
                  <div className="text-[11px] text-gray-400">Media & News Publications</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30">
                {journalistOverview.totalJournalists} Journalists
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Articles Today</div>
                <div className="text-lg font-black text-white mt-0.5">{journalistOverview.articlesToday}</div>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Drafts</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">{journalistOverview.draftsCount}</div>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Total Views</div>
                <div className="text-lg font-black text-purple-400 mt-0.5 font-mono">
                  {journalistOverview.totalViews.toLocaleString()}
                </div>
              </div>
            </div>

            {journalistOverview.mostViewedArticle ? (
              <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-1">
                <div className="text-[10px] text-purple-400 font-bold uppercase">🔥 Most Viewed Article</div>
                <div className="text-xs font-bold text-white line-clamp-1">
                  {journalistOverview.mostViewedArticle.title}
                </div>
                <div className="text-[10px] text-gray-400">
                  By {journalistOverview.mostViewedArticle.author} • {journalistOverview.mostViewedArticle.views.toLocaleString()} views
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] text-center text-xs text-gray-500">
                No articles published in database yet.
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenModal('journalist')}
            className="w-full py-2.5 px-4 bg-[#222222] hover:bg-purple-600 hover:text-white text-purple-300 font-bold text-xs rounded-xl border border-[#333333] hover:border-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>View Journalist Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2. TEAM OVERVIEW CARD */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase">Team Overview</h3>
                  <div className="text-[11px] text-gray-400">Clubs, Squads & Training</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                {teamOverview.totalTeams} Teams
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Avg Squad Size</div>
                <div className="text-lg font-black text-white mt-0.5">{teamOverview.avgPlayersPerTeam}</div>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Completion</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
                  {teamOverview.avgSquadCompletion}%
                </div>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Needs Attention</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">{teamOverview.teamsNeedingAttentionCount}</div>
              </div>
            </div>

            {teamOverview.latestSquadSubmission ? (
              <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-1">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">📋 Latest Squad Submission</div>
                <div className="text-xs font-bold text-white">
                  {teamOverview.latestSquadSubmission.teamName}
                </div>
                <div className="text-[10px] text-gray-400">
                  Submitted {teamOverview.latestSquadSubmission.submittedAt} by {teamOverview.latestSquadSubmission.coachName}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] text-center text-xs text-gray-500">
                No active squads submitted in database.
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenModal('team')}
            className="w-full py-2.5 px-4 bg-[#222222] hover:bg-emerald-600 hover:text-white text-emerald-300 font-bold text-xs rounded-xl border border-[#333333] hover:border-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>View Team Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. REFEREE OVERVIEW CARD */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-amber-500/40 transition-all space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase">Referee Overview</h3>
                  <div className="text-[11px] text-gray-400">Officials & Match Reports</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-600/20 text-amber-300 border border-amber-500/30">
                {refereeOverview.totalReferees} Referees
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Available</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{refereeOverview.availableReferees}</div>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Assigned Today</div>
                <div className="text-lg font-black text-white mt-0.5">{refereeOverview.assignedToday}</div>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Pending Reports</div>
                <div className="text-lg font-black text-rose-400 mt-0.5 font-mono">{refereeOverview.pendingReportsCount}</div>
              </div>
            </div>

            <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between text-xs">
              <span className="text-gray-400">Avg Report Submission Time</span>
              <span className="font-mono font-bold text-amber-400">{refereeOverview.avgReportCompletionTimeMins} minutes</span>
            </div>
          </div>

          <button
            onClick={() => onOpenModal('referee')}
            className="w-full py-2.5 px-4 bg-[#222222] hover:bg-amber-600 hover:text-white text-amber-300 font-bold text-xs rounded-xl border border-[#333333] hover:border-amber-500 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>View Referee Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4. PRESIDENT OVERVIEW CARD */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-blue-500/40 transition-all space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase">President Overview</h3>
                  <div className="text-[11px] text-gray-400">Governance & Competitions</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                Executive Desk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Announcements Sent</div>
                <div className="text-lg font-black text-white mt-0.5">{presidentOverview.totalAnnouncements}</div>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="text-[10px] text-gray-400 font-semibold">Fixtures Generated</div>
                <div className="text-lg font-black text-blue-400 mt-0.5 font-mono">{presidentOverview.fixtureGenerationsCount} Runs</div>
              </div>
            </div>

            <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between text-xs">
              <span className="text-gray-400">Current Season</span>
              <span className="font-bold text-emerald-400">{presidentOverview.currentCompetition}</span>
            </div>
          </div>

          <button
            onClick={() => onOpenModal('president')}
            className="w-full py-2.5 px-4 bg-[#222222] hover:bg-blue-600 hover:text-white text-blue-300 font-bold text-xs rounded-xl border border-[#333333] hover:border-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>View President Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
