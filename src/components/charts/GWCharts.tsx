import ReactECharts from 'echarts-for-react';
import { FrequencySeries, TimeSeries, PosteriorSamples } from '@shared/types';

interface SensitivityChartProps {
  sensitivityCurve: FrequencySeries;
  designCurve?: FrequencySeries;
  height?: number;
}

export function SensitivityChart({ sensitivityCurve, designCurve, height = 300 }: SensitivityChartProps) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e0f0ff', fontSize: 12 },
      formatter: (params: any) => {
        const f = params[0].value[0];
        let html = `<div style="font-family: monospace;">频率: ${f.toFixed(1)} Hz<br/>`;
        params.forEach((p: any) => {
          html += `${p.seriesName}: ${p.value[1].toExponential(2)} 1/√Hz<br/>`;
        });
        html += '</div>';
        return html;
      },
    },
    grid: {
      left: '12%',
      right: '5%',
      top: '10%',
      bottom: '15%',
    },
    xAxis: {
      type: 'log',
      name: '频率 (Hz)',
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
      minorSplitLine: { show: false },
    },
    yAxis: {
      type: 'log',
      name: '应变 ASD (1/√Hz)',
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: {
        color: '#8ba9c0',
        fontSize: 10,
        formatter: (val: number) => val.toExponential(0),
      },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
      minorSplitLine: { show: false },
    },
    series: [
      {
        name: '当前灵敏度',
        type: 'line',
        data: sensitivityCurve.frequencies.map((f, i) => [f, sensitivityCurve.values[i]]),
        smooth: true,
        lineStyle: { color: '#00d4ff', width: 2 },
        itemStyle: { color: '#00d4ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 212, 255, 0.2)' },
              { offset: 1, color: 'rgba(0, 212, 255, 0.02)' },
            ],
          },
        },
      },
      ...(designCurve ? [{
        name: '设计目标',
        type: 'line',
        data: designCurve.frequencies.map((f, i) => [f, designCurve.values[i] * 0.8]),
        smooth: true,
        lineStyle: { color: '#00ff88', width: 1, type: 'dashed' as const },
        itemStyle: { color: '#00ff88' },
      }] : []),
    ],
  };

  return <ReactECharts option={option} style={{ height }} theme="dark" />;
}

interface NoiseComponentsChartProps {
  frequencies: number[];
  seismic: number[];
  thermal: number[];
  shot: number[];
  radiationPressure: number[];
  total: number[];
  height?: number;
}

export function NoiseComponentsChart({
  frequencies,
  seismic,
  thermal,
  shot,
  radiationPressure,
  total,
  height = 300,
}: NoiseComponentsChartProps) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e0f0ff', fontSize: 12 },
    },
    legend: {
      data: ['总噪声', '地震噪声', '热噪声', '散粒噪声', '辐射压噪声'],
      textStyle: { color: '#8ba9c0', fontSize: 11 },
      top: 5,
    },
    grid: {
      left: '12%',
      right: '3%',
      top: '18%',
      bottom: '15%',
    },
    xAxis: {
      type: 'log',
      name: '频率 (Hz)',
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    yAxis: {
      type: 'log',
      name: '噪声 ASD',
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10, formatter: (v: number) => v.toExponential(0) },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    series: [
      {
        name: '总噪声',
        type: 'line',
        data: frequencies.map((f, i) => [f, total[i]]),
        smooth: true,
        lineStyle: { color: '#00d4ff', width: 2.5 },
        itemStyle: { color: '#00d4ff' },
      },
      {
        name: '地震噪声',
        type: 'line',
        data: frequencies.map((f, i) => [f, seismic[i]]),
        smooth: true,
        lineStyle: { color: '#ff6b35', width: 1.5, type: 'dashed' as const },
        itemStyle: { color: '#ff6b35' },
      },
      {
        name: '热噪声',
        type: 'line',
        data: frequencies.map((f, i) => [f, thermal[i]]),
        smooth: true,
        lineStyle: { color: '#ffcc00', width: 1.5, type: 'dashed' as const },
        itemStyle: { color: '#ffcc00' },
      },
      {
        name: '散粒噪声',
        type: 'line',
        data: frequencies.map((f, i) => [f, shot[i]]),
        smooth: true,
        lineStyle: { color: '#00ff88', width: 1.5, type: 'dashed' as const },
        itemStyle: { color: '#00ff88' },
      },
      {
        name: '辐射压噪声',
        type: 'line',
        data: frequencies.map((f, i) => [f, radiationPressure[i]]),
        smooth: true,
        lineStyle: { color: '#b388ff', width: 1.5, type: 'dashed' as const },
        itemStyle: { color: '#b388ff' },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} theme="dark" />;
}

interface WaveformChartProps {
  times: number[];
  signal: number[];
  noise?: number[];
  combined?: number[];
  height?: number;
}

export function WaveformChart({ times, signal, noise, combined, height = 250 }: WaveformChartProps) {
  const series = [];

  if (combined) {
    series.push({
      name: '含噪声数据',
      type: 'line',
      data: times.map((t, i) => [t, combined[i]]),
      lineStyle: { color: '#8ba9c0', width: 0.8 },
      itemStyle: { color: '#8ba9c0' },
      showSymbol: false,
      sampling: 'lttb',
    });
  }

  series.push({
    name: '注入信号',
    type: 'line',
    data: times.map((t, i) => [t, signal[i]]),
    smooth: true,
    lineStyle: { color: '#00ff88', width: 2 },
    itemStyle: { color: '#00ff88' },
    showSymbol: false,
    areaStyle: combined
      ? undefined
      : {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 255, 136, 0.3)' },
              { offset: 1, color: 'rgba(0, 255, 136, 0.02)' },
            ],
          },
        },
  });

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e0f0ff', fontSize: 12 },
      formatter: (params: any) => {
        const t = params[0].value[0];
        let html = `<div style="font-family: monospace;">时间: ${t.toFixed(3)} s<br/>`;
        params.forEach((p: any) => {
          html += `${p.seriesName}: ${p.value[1].toExponential(2)}<br/>`;
        });
        html += '</div>';
        return html;
      },
    },
    legend: {
      data: series.map((s) => s.name),
      textStyle: { color: '#8ba9c0', fontSize: 11 },
      top: 5,
    },
    grid: {
      left: '12%',
      right: '3%',
      top: '18%',
      bottom: '15%',
    },
    xAxis: {
      type: 'value',
      name: '时间 (s)',
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: '应变',
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10, formatter: (v: number) => v.toExponential(0) },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    series,
  };

  return <ReactECharts option={option} style={{ height }} theme="dark" />;
}

interface PosteriorHistogramProps {
  samples: number[];
  parameterName: string;
  unit?: string;
  height?: number;
  color?: string;
}

export function PosteriorHistogram({
  samples,
  parameterName,
  unit,
  height = 200,
  color = '#00d4ff',
}: PosteriorHistogramProps) {
  const sorted = [...samples].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const binCount = 50;
  const binWidth = (max - min) / binCount;
  const bins = new Array(binCount).fill(0);

  samples.forEach((s) => {
    const idx = Math.min(binCount - 1, Math.floor((s - min) / binWidth));
    bins[idx]++;
  });

  const median = sorted[Math.floor(sorted.length * 0.5)];
  const lower = sorted[Math.floor(sorted.length * 0.16)];
  const upper = sorted[Math.floor(sorted.length * 0.84)];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e0f0ff', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        return `${parameterName}: ${p.value[0].toFixed(2)}${unit ? ' ' + unit : ''}<br/>样本数: ${p.value[1]}`;
      },
    },
    grid: {
      left: '12%',
      right: '5%',
      top: '10%',
      bottom: '18%',
    },
    xAxis: {
      type: 'value',
      name: `${parameterName}${unit ? ` (${unit})` : ''}`,
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '计数',
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: bins.map((count, i) => [min + (i + 0.5) * binWidth, count]),
        barWidth: '80%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + 'cc' },
              { offset: 1, color: color + '33' },
            ],
          },
          borderRadius: [2, 2, 0, 0],
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ffffff', type: 'dashed', width: 1 },
          label: { show: false },
          data: [
            { xAxis: median, lineStyle: { color: '#00ff88' } },
            { xAxis: lower, lineStyle: { color: '#ffcc00', type: 'dashed' } },
            { xAxis: upper, lineStyle: { color: '#ffcc00', type: 'dashed' } },
          ],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} theme="dark" />;
}

interface TrendChartProps {
  dates: string[];
  series: { name: string; data: number[]; color: string; unit?: string }[];
  height?: number;
  yAxisName?: string;
}

export function TrendChart({ dates, series, height = 300, yAxisName }: TrendChartProps) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e0f0ff', fontSize: 12 },
    },
    legend: {
      data: series.map((s) => s.name),
      textStyle: { color: '#8ba9c0', fontSize: 11 },
      top: 5,
    },
    grid: {
      left: '10%',
      right: '3%',
      top: '15%',
      bottom: '12%',
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: { color: '#6b8fa8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: s.color + '33' },
            { offset: 1, color: s.color + '03' },
          ],
        },
      },
    })),
  };

  return <ReactECharts option={option} style={{ height }} theme="dark" />;
}

interface CornerPlotProps {
  samples: PosteriorSamples;
  height?: number;
}

export function CornerPlot({ samples, height = 400 }: CornerPlotProps) {
  const params = [
    { key: 'mass1', name: '质量1', unit: 'M☉', data: samples.mass1 },
    { key: 'mass2', name: '质量2', unit: 'M☉', data: samples.mass2 },
    { key: 'spin1', name: '自旋1', data: samples.spin1 },
    { key: 'spin2', name: '自旋2', data: samples.spin2 },
    { key: 'distance', name: '距离', unit: 'Mpc', data: samples.distance },
  ];

  const n = params.length;
  const cellSize = height / (n + 0.5);

  return (
    <div className="relative" style={{ height }}>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          gridTemplateRows: `repeat(${n}, 1fr)`,
          height: '100%',
        }}
      >
        {params.map((row, i) =>
          params.map((col, j) => {
            if (i < j) return <div key={`${i}-${j}`} />;

            const xData = col.data;
            const yData = row.data;

            if (i === j) {
              return (
                <div key={`${i}-${j}`} className="glass-card p-2 overflow-hidden">
                  <div className="text-xs text-space-400 mb-1">{row.name}</div>
                  <PosteriorHistogram
                    samples={row.data}
                    parameterName=""
                    height={cellSize * 0.6}
                    color="#00d4ff"
                  />
                </div>
              );
            }

            const downsample = xData.length > 500;
            const step = downsample ? Math.floor(xData.length / 500) : 1;
            const plotData: [number, number][] = [];
            for (let k = 0; k < xData.length; k += step) {
              plotData.push([xData[k], yData[k]]);
            }

            return (
              <div key={`${i}-${j}`} className="glass-card p-1 overflow-hidden">
                <ScatterPlot
                  data={plotData}
                  xLabel={col.name}
                  yLabel={row.name}
                  height={cellSize * 0.8}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ScatterPlot({
  data,
  xLabel,
  yLabel,
  height,
}: {
  data: [number, number][];
  xLabel: string;
  yLabel: string;
  height: number;
}) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e0f0ff', fontSize: 10 },
      formatter: (params: any) => {
        return `${xLabel}: ${params.value[0].toFixed(2)}<br/>${yLabel}: ${params.value[1].toFixed(2)}`;
      },
    },
    grid: {
      left: '25%',
      right: '10%',
      top: '10%',
      bottom: '20%',
    },
    xAxis: {
      type: 'value',
      name: xLabel,
      nameTextStyle: { color: '#6b8fa8', fontSize: 9 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 8 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: yLabel,
      nameTextStyle: { color: '#6b8fa8', fontSize: 9 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 8 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.05)', type: 'dashed' } },
    },
    series: [
      {
        type: 'scatter',
        data,
        symbolSize: 3,
        itemStyle: {
          color: 'rgba(0, 212, 255, 0.6)',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} theme="dark" />;
}
