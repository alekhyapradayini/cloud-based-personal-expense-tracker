/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface TrendData {
  month: string;
  amount: number;
}

interface TrendChartProps {
  data: TrendData[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 font-sans text-sm">
        No trend data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.amount), 100);
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;

  // Compute points for SVG lines and bars
  const graphHeight = chartHeight - padding * 2;
  const graphWidth = chartWidth - padding * 2;

  const points = data.map((d, index) => {
    const x = padding + (index * (graphWidth / Math.max(data.length - 1, 1)));
    const y = chartHeight - padding - (d.amount / maxVal) * graphHeight;
    return { x, y, amount: d.amount, month: d.month };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  return (
    <div className="w-full">
      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * graphHeight;
            const value = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 5}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 text-[10px] font-mono"
                >
                  ₹{value.toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#trendGrad)"
              opacity="0.15"
            />
          )}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? '6' : '4'}
                className="fill-white stroke-blue-600 cursor-pointer transition-all duration-150"
                strokeWidth={hoveredIndex === idx ? '3' : '2'}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {hoveredIndex === idx && (
                <g>
                  {/* Tooltip Background */}
                  <rect
                    x={Math.max(10, p.x - 55)}
                    y={Math.max(5, p.y - 38)}
                    width="110"
                    height="28"
                    rx="4"
                    className="fill-slate-900 shadow-md"
                  />
                  <text
                    x={Math.max(10, p.x - 55) + 55}
                    y={Math.max(5, p.y - 38) + 18}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-medium font-sans"
                  >
                    {p.month}: ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="fill-gray-500 text-[10px] font-sans font-medium"
            >
              {p.month.split(' ')[0]}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};


interface CategoryDist {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryChartProps {
  data: CategoryDist[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 font-sans text-sm">
        No expense category data
      </div>
    );
  }

  // Draw an elegant circular Donut chart inside SVG, alongside bento progress list
  let cumulativePercent = 0;
  const radius = 50;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* Donut Chart Visualizer */}
      <div className="md:col-span-5 flex justify-center">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="fill-none stroke-gray-100"
              strokeWidth="12"
            />

            {data.map((cat, idx) => {
              const strokeLength = (cat.percentage / 100) * circ;
              const strokeOffset = circ - (cumulativePercent / 100) * circ;
              cumulativePercent += cat.percentage;

              return (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none transition-all duration-300"
                  stroke={cat.color}
                  strokeWidth="12"
                  strokeDasharray={`${strokeLength} ${circ}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap={cat.percentage > 4 ? 'round' : 'butt'}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-3 shadow-inner">
            <span className="text-xs text-gray-500 font-sans">Total</span>
            <span className="text-sm font-bold text-gray-900 font-sans">
              ₹{data.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Categories Percent Breakdown List */}
      <div className="md:col-span-7 space-y-3">
        {data.slice(0, 5).map((cat, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2 font-sans font-medium text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                <span>{cat.categoryName}</span>
              </div>
              <div className="font-mono font-medium text-gray-900">
                ₹{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({cat.percentage}%)
              </div>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
              />
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <div className="text-center text-[11px] text-gray-400 font-sans pt-1">
            + {data.length - 5} more categories
          </div>
        )}
      </div>
    </div>
  );
};
