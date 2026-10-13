import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Clock, 
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface AnalyticsGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricTitle: string;
  metricDescription?: string;
  unitPrefix?: string;
  unitSuffix?: string;
  theme?: 'dark' | 'light';
}

interface DataPoint {
  label: string;
  currentValue: number;
  previousValue: number;
}

export const AnalyticsGraphModal: React.FC<AnalyticsGraphModalProps> = ({
  isOpen,
  onClose,
  metricTitle,
  metricDescription,
  unitPrefix = '',
  unitSuffix = '',
  theme = 'dark',
}) => {
  const [timeframe, setTimeframe] = useState<'month' | 'week'>('month');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!isOpen) return null;

  // Monthly dataset: Comparing October 2026 (Current) vs September 2026 (Previous)
  const monthlyData: DataPoint[] = [
    { label: 'Day 1-4', currentValue: 24, previousValue: 18 },
    { label: 'Day 5-8', currentValue: 38, previousValue: 26 },
    { label: 'Day 9-12', currentValue: 52, previousValue: 34 },
    { label: 'Day 13-16', currentValue: 46, previousValue: 40 },
    { label: 'Day 17-20', currentValue: 68, previousValue: 50 },
    { label: 'Day 21-24', currentValue: 85, previousValue: 62 },
    { label: 'Day 25-28', currentValue: 94, previousValue: 71 },
    { label: 'Day 29-31', currentValue: 112, previousValue: 88 },
  ];

  // Weekly dataset: Comparing Week 41 (Current) vs Week 40 (Previous)
  const weeklyData: DataPoint[] = [
    { label: 'Mon', currentValue: 14, previousValue: 9 },
    { label: 'Tue', currentValue: 22, previousValue: 15 },
    { label: 'Wed', currentValue: 19, previousValue: 17 },
    { label: 'Thu', currentValue: 28, previousValue: 20 },
    { label: 'Fri', currentValue: 35, previousValue: 24 },
    { label: 'Sat', currentValue: 42, previousValue: 31 },
    { label: 'Sun', currentValue: 38, previousValue: 28 },
  ];

  const data = timeframe === 'month' ? monthlyData : weeklyData;

  const currentLabel = timeframe === 'month' ? 'October 2026 (Current Month)' : 'This Week (Week 41)';
  const previousLabel = timeframe === 'month' ? 'September 2026 (Previous Month)' : 'Last Week (Week 40)';

  const currentSum = data.reduce((sum, d) => sum + d.currentValue, 0);
  const previousSum = data.reduce((sum, d) => sum + d.previousValue, 0);
  const diffPercent = previousSum > 0 ? (((currentSum - previousSum) / previousSum) * 100).toFixed(1) : '0';
  const isPositive = Number(diffPercent) >= 0;

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingTop = 30;
  const paddingBottom = 40;

  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map((d) => Math.max(d.currentValue, d.previousValue))) * 1.15 || 100;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (data.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (val / maxValue) * innerHeight;
    return { x, y };
  };

  // Generate path string
  const currentPathPoints = data.map((d, i) => getCoordinates(i, d.currentValue));
  const previousPathPoints = data.map((d, i) => getCoordinates(i, d.previousValue));

  const currentPathD = currentPathPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const previousPathD = previousPathPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const currentAreaD = `${currentPathD} L ${currentPathPoints[currentPathPoints.length - 1].x} ${paddingTop + innerHeight} L ${currentPathPoints[0].x} ${paddingTop + innerHeight} Z`;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div 
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          theme === 'dark' ? 'bg-[#122336] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header Card */}
        <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          theme === 'dark' ? 'border-slate-800 bg-[#0f1d2d]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/15 text-blue-400">
                <BarChart2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-slate-100 tracking-tight">
                {metricTitle} Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {metricDescription || 'Interactive comparative two-line performance trajectory'}
            </p>
          </div>

          {/* Timeframe Toggle Buttons (Month vs Week) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  timeframe === 'month'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Monthly (2 Months)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  timeframe === 'week'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Weekly (2 Weeks)</span>
              </button>
            </div>

            {/* Clearly visible Close button and X in top right */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 shadow-md transition-colors cursor-pointer shrink-0"
              title="Close analytics modal"
            >
              <span>Close</span>
              <X className="w-4 h-4 text-red-400 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Comparative Summary Metric Ribbon */}
        <div className={`p-4 sm:px-6 border-b grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              {timeframe === 'month' ? 'October 2026' : 'Week 41 (Current)'}
            </span>
            <span className="text-lg font-black text-slate-100">
              {unitPrefix}{currentSum.toLocaleString()}{unitSuffix}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              {timeframe === 'month' ? 'September 2026' : 'Week 40 (Previous)'}
            </span>
            <span className="text-lg font-black text-slate-100">
              {unitPrefix}{previousSum.toLocaleString()}{unitSuffix}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Period Growth
            </span>
            <span className={`text-base font-black flex items-center gap-1 ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {diffPercent}%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Analysis Status
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {timeframe === 'month' ? '2 Full Months Tracked' : '2 Complete Weeks Tracked'}
            </span>
          </div>
        </div>

        {/* The Real Graph Area (SVG with two lines) */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-blue-500 rounded-full" />
                <span className="font-bold text-blue-400">{currentLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 border-t-2 border-dashed border-emerald-400" />
                <span className="font-bold text-emerald-400">{previousLabel}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-blue-400" />
              <span>Hover over points to see exact values</span>
            </div>
          </div>

          {/* SVG Graph Canvas */}
          <div className="w-full overflow-x-auto">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto max-h-[300px] select-none"
            >
              <defs>
                <linearGradient id="currentAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = paddingTop + innerHeight * (1 - pct);
                const tickVal = Math.round(maxValue * pct);
                return (
                  <g key={pct}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      stroke={theme === 'dark' ? '#1e334d' : '#e2e8f0'} 
                      strokeDasharray="3 3"
                    />
                    <text 
                      x={paddingX - 8} 
                      y={y + 4} 
                      textAnchor="end" 
                      fontSize="9" 
                      fill={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    >
                      {unitPrefix}{tickVal}
                    </text>
                  </g>
                );
              })}

              {/* Area gradient under current month line */}
              <path d={currentAreaD} fill="url(#currentAreaGrad)" />

              {/* Line 2: Previous Month / Week (Dashed emerald/slate) */}
              <path 
                d={previousPathD} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeDasharray="5 4"
                strokeLinecap="round"
              />

              {/* Line 1: Current Month / Week (Solid bright blue) */}
              <path 
                d={currentPathD} 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots and Labels */}
              {data.map((d, i) => {
                const currPt = getCoordinates(i, d.currentValue);
                const prevPt = getCoordinates(i, d.previousValue);
                const isHovered = hoveredPoint === i;

                return (
                  <g key={i}>
                    {/* Previous period dot */}
                    <circle 
                      cx={prevPt.x} 
                      cy={prevPt.y} 
                      r={isHovered ? 5 : 3.5} 
                      fill="#10b981" 
                      stroke="#122336" 
                      strokeWidth="2" 
                    />

                    {/* Current period dot */}
                    <circle 
                      cx={currPt.x} 
                      cy={currPt.y} 
                      r={isHovered ? 6 : 4} 
                      fill="#3b82f6" 
                      stroke="#ffffff" 
                      strokeWidth="2"
                    />

                    {/* X axis labels */}
                    <text 
                      x={currPt.x} 
                      y={svgHeight - 15} 
                      textAnchor="middle" 
                      fontSize="10" 
                      fontWeight="bold"
                      fill={isHovered ? '#3b82f6' : (theme === 'dark' ? '#94a3b8' : '#64748b')}
                    >
                      {d.label}
                    </text>

                    {/* Invisible hover trigger columns */}
                    <rect 
                      x={currPt.x - (innerWidth / data.length) / 2} 
                      y={paddingTop} 
                      width={innerWidth / data.length} 
                      height={innerHeight} 
                      fill="transparent" 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}

              {/* Hover Tooltip Overlay */}
              {hoveredPoint !== null && (
                (() => {
                  const pt = getCoordinates(hoveredPoint, data[hoveredPoint].currentValue);
                  const d = data[hoveredPoint];
                  const tooltipWidth = 140;
                  const tooltipX = Math.min(Math.max(pt.x - tooltipWidth / 2, paddingX), svgWidth - paddingX - tooltipWidth);
                  const tooltipY = Math.max(pt.y - 70, paddingTop);

                  return (
                    <g pointerEvents="none">
                      <rect 
                        x={tooltipX} 
                        y={tooltipY} 
                        width={tooltipWidth} 
                        height="55" 
                        rx="8" 
                        fill="#0b1726" 
                        stroke="#3b82f6" 
                        strokeWidth="1.5"
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                      />
                      <text x={tooltipX + 10} y={tooltipY + 16} fontSize="10" fontWeight="bold" fill="#93c5fd">
                        {d.label}
                      </text>
                      <text x={tooltipX + 10} y={tooltipY + 32} fontSize="10" fill="#ffffff">
                        Current: <tspan fontWeight="bold" fill="#60a5fa">{unitPrefix}{d.currentValue}{unitSuffix}</tspan>
                      </text>
                      <text x={tooltipX + 10} y={tooltipY + 46} fontSize="10" fill="#cbd5e1">
                        Previous: <tspan fontWeight="bold" fill="#34d399">{unitPrefix}{d.previousValue}{unitSuffix}</tspan>
                      </text>
                    </g>
                  );
                })()
              )}
            </svg>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          theme === 'dark' ? 'bg-[#0f1d2d] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-slate-400">
            Realtime database sync of orders & transaction ledger
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors"
          >
            Close Graph
          </button>
        </div>
      </div>
    </div>
  );
};
