import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, Layers } from 'lucide-react';
import { DAU_WEEKLY_DATA, PSYCH_SYSTEM_DATA } from '../../constants';

export const AnalyticsCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chart: DAU & Session Length */}
      <div className="lg:col-span-2 bg-[#181818] border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              User Psychology & Habit Formation Funnel
            </h3>
            <p className="text-xs text-gray-400">
              Weekly DAU vs "Dream Team" prediction loops & slot-machine dopamine hit triggers
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            Nir Eyal Hook Model
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DAU_WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="dopamineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  borderColor: '#374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="dau"
                name="Daily Active Users"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#dauGrad)"
              />
              <Area
                type="monotone"
                dataKey="dopamineHits"
                name="Dopamine Gossip Hits"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#dopamineGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-800 text-center">
          <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">Wed Gossip Drop</div>
            <div className="text-sm font-bold text-amber-400">1,340 Dopamine Hits</div>
          </div>
          <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">Sat Matchday Peak</div>
            <div className="text-sm font-bold text-emerald-400">4,820 Active Students</div>
          </div>
          <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">Prediction Loop</div>
            <div className="text-sm font-bold text-blue-400">2,410 Squads Built</div>
          </div>
        </div>
      </div>

      {/* System 1 vs System 2 Engagement Breakdown */}
      <div className="bg-[#181818] border border-gray-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            System 1 Autopilot Scroll Split
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Kahneman Behavioral State Machine distribution across news waterfall feed
          </p>
        </div>

        <div className="h-44 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PSYCH_SYSTEM_DATA}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
              >
                {PSYCH_SYSTEM_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  borderColor: '#374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 border-t border-gray-800 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              System 1 Trance (Waterfall Scroll)
            </span>
            <span className="font-mono font-bold text-emerald-400">84%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              System 2 Analytical Choice
            </span>
            <span className="font-mono font-bold text-blue-400">16%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
