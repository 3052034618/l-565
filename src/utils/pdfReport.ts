import jsPDF from 'jspdf';
import * as echarts from 'echarts';

interface PDFReportData {
  taskName: string;
  taskId: string;
  createdAt: string;
  detectorName: string;
  noiseModelVersion: string;
  signalSourceType: string;
  mass1: number;
  mass2: number;
  spin1: number;
  spin2: number;
  distance: number;
  snr: number;
  sensitivityFrequencies: number[];
  sensitivityValues: number[];
  noiseFrequencies: number[];
  noiseValues: number[];
  waveformTimes: number[];
  waveformValues: number[];
  mass1Posterior: number[];
  mass2Posterior: number[];
  spin1Posterior: number[];
  spin2Posterior: number[];
  distancePosterior: number[];
  mass1True: number;
  mass2True: number;
  spin1True: number;
  spin2True: number;
  distanceTrue: number;
}

function sanitizeData(values: number[]): number[] {
  return values.filter(v => isFinite(v) && !isNaN(v));
}

function renderChartToDataURL(
  option: echarts.EChartsOption,
  width: number,
  height: number
): string {
  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.position = 'fixed';
  div.style.left = '0';
  div.style.top = '0';
  div.style.zIndex = '-9999';
  div.style.opacity = '0';
  div.style.pointerEvents = 'none';
  document.body.appendChild(div);

  const chart = echarts.init(div, undefined, { renderer: 'canvas' });
  chart.setOption(option);
  chart.resize();
  const dataUrl = chart.getDataURL({
    backgroundColor: '#0a1628',
    pixelRatio: 1,
    type: 'png',
  });
  chart.dispose();
  document.body.removeChild(div);

  return dataUrl;
}

function getSensitivityOption(frequencies: number[], values: number[]): echarts.EChartsOption {
  const validFreqs = sanitizeData(frequencies);
  const validVals = sanitizeData(values);
  const data = validFreqs.map((f, i) => [f, validVals[i] || 0]).filter(d => d[0] > 0 && d[1] > 0);

  return {
    backgroundColor: '#0a1628',
    animation: false,
    title: {
      text: 'Sensitivity Curve',
      textStyle: { color: '#e0f0ff', fontSize: 14 },
      left: 'center',
    },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'log',
      name: 'Frequency (Hz)',
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 9 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'log',
      name: 'Strain ASD',
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 9 },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'line',
        data: data,
        smooth: false,
        lineStyle: { color: '#00d4ff', width: 2 },
        showSymbol: false,
      },
    ],
  };
}

function getNoiseOption(frequencies: number[], values: number[]): echarts.EChartsOption {
  const validFreqs = sanitizeData(frequencies);
  const validVals = sanitizeData(values);
  const data = validFreqs.map((f, i) => [f, validVals[i] || 0]).filter(d => d[0] > 0 && d[1] > 0);

  return {
    backgroundColor: '#0a1628',
    animation: false,
    title: {
      text: 'Noise Power Spectrum',
      textStyle: { color: '#e0f0ff', fontSize: 14 },
      left: 'center',
    },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'log',
      name: 'Frequency (Hz)',
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 9 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'log',
      name: 'Noise PSD',
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 9 },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'line',
        data: data,
        smooth: false,
        lineStyle: { color: '#00d4ff', width: 2 },
        showSymbol: false,
      },
    ],
  };
}

function getWaveformOption(times: number[], values: number[]): echarts.EChartsOption {
  const validTimes = sanitizeData(times);
  const validVals = sanitizeData(values);
  const data = validTimes.map((t, i) => [t, validVals[i] || 0]);

  return {
    backgroundColor: '#0a1628',
    animation: false,
    title: {
      text: 'Injected Signal Waveform',
      textStyle: { color: '#e0f0ff', fontSize: 14 },
      left: 'center',
    },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'value',
      name: 'Time (s)',
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 9 },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
    },
    yAxis: {
      type: 'value',
      name: 'Strain',
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 9 },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
    },
    series: [
      {
        type: 'line',
        data: data,
        lineStyle: { color: '#00ff88', width: 1.5 },
        showSymbol: false,
      },
    ],
  };
}

function getHistogramOption(data: number[], trueValue: number, title: string, unit: string): echarts.EChartsOption {
  const validData = sanitizeData(data);

  if (validData.length === 0) {
    return {
      backgroundColor: '#0a1628',
      animation: false,
      title: { text: title, textStyle: { color: '#e0f0ff', fontSize: 14 }, left: 'center' },
      series: [],
    };
  }

  const bins = Math.min(25, Math.max(10, Math.floor(Math.sqrt(validData.length))));
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min;

  if (range <= 0 || !isFinite(range)) {
    return {
      backgroundColor: '#0a1628',
      animation: false,
      title: { text: title, textStyle: { color: '#e0f0ff', fontSize: 14 }, left: 'center' },
      series: [],
    };
  }

  const binWidth = range / bins;
  const counts = new Array(bins).fill(0);
  validData.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    if (idx >= 0 && idx < bins) counts[idx]++;
  });

  const binLabels = counts.map((_, i) => (min + (i + 0.5) * binWidth).toFixed(2));
  const maxCount = Math.max(...counts) || 1;
  const trueIdx = Math.min(Math.max(Math.floor((trueValue - min) / binWidth), 0), bins - 1);

  const markLineData = counts.map((_, i) => {
    if (i === trueIdx) {
      return {
        xAxis: binLabels[i],
        lineStyle: { color: '#ff6b35', width: 2, type: 'dashed' },
        label: { show: false },
      };
    }
    return null;
  }).filter(Boolean);

  return {
    backgroundColor: '#0a1628',
    animation: false,
    title: {
      text: title,
      textStyle: { color: '#e0f0ff', fontSize: 14 },
      left: 'center',
    },
    grid: { left: 50, right: 20, top: 40, bottom: 60 },
    xAxis: {
      type: 'category',
      name: unit,
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      data: binLabels,
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 8, rotate: 45, interval: 'auto' },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { color: '#6b8fa8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8ba9c0', fontSize: 9 },
      splitLine: { show: false },
      min: 0,
      max: maxCount * 1.3,
    },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: { color: 'rgba(0, 212, 255, 0.6)' },
        markLine: {
          symbol: 'none',
          silent: true,
          data: [
            {
              xAxis: binLabels[trueIdx],
              lineStyle: { color: '#ff6b35', width: 2, type: 'dashed' },
            },
          ],
        },
      },
    ],
  };
}

export function generatePDFReport(data: PDFReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let y = margin;

  doc.setTextColor(0, 212, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Gravitational Wave Analysis Report', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setTextColor(139, 169, 192);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Task ID: ${data.taskId}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setDrawColor(0, 212, 255, 0.3);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(224, 240, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Task Overview', margin, y);
  y += 7;

  doc.setTextColor(139, 169, 192);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const infoItems = [
    { label: 'Task Name', value: data.taskName },
    { label: 'Created At', value: new Date(data.createdAt).toLocaleString('en-US') },
    { label: 'Detector', value: data.detectorName },
    { label: 'Noise Model', value: data.noiseModelVersion },
    { label: 'Source Type', value: data.signalSourceType },
  ];

  infoItems.forEach((item) => {
    doc.setTextColor(107, 143, 168);
    doc.text(item.label + ':', margin, y);
    doc.setTextColor(224, 240, 255);
    doc.text(item.value, margin + 35, y);
    y += 6;
  });

  y += 3;
  const signalParams = [
    { label: 'Mass 1', value: `${data.mass1} Msun` },
    { label: 'Mass 2', value: `${data.mass2} Msun` },
    { label: 'Spin 1', value: data.spin1.toFixed(3) },
    { label: 'Spin 2', value: data.spin2.toFixed(3) },
    { label: 'Distance', value: `${data.distance} Mpc` },
    { label: 'SNR', value: data.snr.toFixed(2) },
  ];

  signalParams.forEach((item) => {
    doc.setTextColor(107, 143, 168);
    doc.text(item.label + ':', margin, y);
    doc.setTextColor(0, 255, 136);
    doc.text(item.value, margin + 35, y);
    y += 6;
  });

  y += 5;
  doc.setDrawColor(0, 212, 255, 0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const chartWidthMm = 180;
  const chartHeightMm = 75;
  const chartPxWidth = 720;
  const chartPxHeight = 300;

  const addChart = (imgData: string, title: string) => {
    if (y + chartHeightMm + 8 > pageHeight - margin) {
      doc.addPage();
      doc.setFillColor(10, 22, 40);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      y = margin;
    }
    doc.addImage(imgData, 'PNG', margin, y, chartWidthMm, chartHeightMm);
    y += chartHeightMm + 8;
  };

  const safeRender = (fn: () => string, name: string): string | null => {
    try {
      return fn();
    } catch (e: any) {
      doc.setTextColor(255, 100, 100);
      doc.setFontSize(10);
      doc.text(`${name} FAILED: ${e?.message || 'unknown'}`, margin, y);
      y += 10;
      return null;
    }
  };

  const sensitivityImg = safeRender(() => renderChartToDataURL(
    getSensitivityOption(data.sensitivityFrequencies, data.sensitivityValues),
    chartPxWidth,
    chartPxHeight
  ), 'Sensitivity');
  if (sensitivityImg) addChart(sensitivityImg, 'Sensitivity Curve');

  const noiseImg = safeRender(() => renderChartToDataURL(
    getNoiseOption(data.noiseFrequencies, data.noiseValues),
    chartPxWidth,
    chartPxHeight
  ), 'Noise');
  if (noiseImg) addChart(noiseImg, 'Noise Power Spectrum');

  const waveformImg = safeRender(() => renderChartToDataURL(
    getWaveformOption(data.waveformTimes, data.waveformValues),
    chartPxWidth,
    chartPxHeight
  ), 'Waveform');
  if (waveformImg) addChart(waveformImg, 'Injected Signal Waveform');

  const mass1HistImg = safeRender(() => renderChartToDataURL(
    getHistogramOption(data.mass1Posterior, data.mass1True, 'Mass 1 Posterior', 'Msun'),
    chartPxWidth,
    chartPxHeight
  ), 'Mass1Hist');
  if (mass1HistImg) addChart(mass1HistImg, 'Mass 1 Posterior Distribution');

  const mass2HistImg = safeRender(() => renderChartToDataURL(
    getHistogramOption(data.mass2Posterior, data.mass2True, 'Mass 2 Posterior', 'Msun'),
    chartPxWidth,
    chartPxHeight
  ), 'Mass2Hist');
  if (mass2HistImg) addChart(mass2HistImg, 'Mass 2 Posterior Distribution');

  const spin1HistImg = safeRender(() => renderChartToDataURL(
    getHistogramOption(data.spin1Posterior, data.spin1True, 'Spin 1 Posterior', ''),
    chartPxWidth,
    chartPxHeight
  ), 'Spin1Hist');
  if (spin1HistImg) addChart(spin1HistImg, 'Spin 1 Posterior Distribution');

  const spin2HistImg = safeRender(() => renderChartToDataURL(
    getHistogramOption(data.spin2Posterior, data.spin2True, 'Spin 2 Posterior', ''),
    chartPxWidth,
    chartPxHeight
  ), 'Spin2Hist');
  if (spin2HistImg) addChart(spin2HistImg, 'Spin 2 Posterior Distribution');

  const distHistImg = safeRender(() => renderChartToDataURL(
    getHistogramOption(data.distancePosterior, data.distanceTrue, 'Distance Posterior', 'Mpc'),
    chartPxWidth,
    chartPxHeight
  ), 'DistHist');
  if (distHistImg) addChart(distHistImg, 'Distance Posterior Distribution');

  const fileName = `GW_Report_${data.taskId}.pdf`;
  doc.save(fileName);
}
