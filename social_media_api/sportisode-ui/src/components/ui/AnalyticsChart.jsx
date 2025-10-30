// src/components/ui/AnalyticsChart.jsx
import React from 'react';
import { Card } from '../components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const AnalyticsChart = ({ data, title }) => {
  // Use Recharts for proper chart visualization
  const maxValue = Math.max(...data.map(item => item.value));

  // Import icons dynamically
  const IconComponent = ({ icon: Icon, className }) => Icon ? <Icon className={className} /> : null;

  // Transform data for Recharts
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    icon: item.icon
  }));

  const chartConfig = data.reduce((config, item, index) => {
    config[item.label.toLowerCase()] = {
      label: item.label,
      color: `hsl(var(--chart-${index + 1}))`,
      icon: item.icon
    };
    return config;
  }, {});

  const getTrendIcon = () => {
    const firstValue = data[0]?.value || 0;
    const lastValue = data[data.length - 1]?.value || 0;

    if (lastValue > firstValue) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (lastValue < firstValue) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    const firstValue = data[0]?.value || 0;
    const lastValue = data[data.length - 1]?.value || 0;

    if (lastValue > firstValue) return 'text-green-500';
    if (lastValue < firstValue) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-medium">{title}</h4>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {data.length > 1 && (
              <>
                {((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1)}%
              </>
            )}
          </span>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar
            dataKey="value"
            fill="hsl(var(--chart-1))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>

      {/* Fallback Simple Bar Chart if Recharts fails */}
      <div className="space-y-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-20">
              {item.icon && <IconComponent icon={item.icon} className="h-4 w-4 text-gray-400" />}
              <div className="text-xs text-gray-400 truncate">
                {item.label}
              </div>
            </div>
            <div className="flex-1">
              <div className="relative h-6 bg-gray-700 rounded">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500 rounded transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className="text-xs font-medium text-white">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">{maxValue.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Peak</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {data.length > 0 ? (data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(0) : 0}
            </div>
            <div className="text-xs text-gray-400">Average</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AnalyticsChart;