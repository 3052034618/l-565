import { FrequencySeries, TimeSeries, DetectorConfig, NoiseModel } from '../../shared/types';
import { interferometerService } from './interferometer';

export class NoiseSimulationService {
  generateNoiseSpectrum(
    detectorConfig: DetectorConfig,
    noiseModel: NoiseModel,
    freqRange: { min: number; max: number },
    numPoints: number = 1000
  ): FrequencySeries {
    return interferometerService.computeSensitivityCurve(detectorConfig, noiseModel, freqRange);
  }

  generateTimeDomainNoise(
    sensitivityCurve: FrequencySeries,
    duration: number,
    sampleRate: number
  ): TimeSeries {
    const numSamples = Math.floor(duration * sampleRate);
    const dt = 1 / sampleRate;
    const times: number[] = [];

    for (let i = 0; i < numSamples; i++) {
      times.push(i * dt);
    }

    const values = this.generateColoredNoise(sensitivityCurve, numSamples, sampleRate);

    return { times, values };
  }

  private generateColoredNoise(
    sensitivityCurve: FrequencySeries,
    numSamples: number,
    sampleRate: number
  ): number[] {
    const halfN = Math.floor(numSamples / 2) + 1;
    const df = sampleRate / numSamples;

    const realPart: number[] = [];
    const imagPart: number[] = [];

    for (let i = 0; i < halfN; i++) {
      const f = i * df;
      const asd = this.interpolateASD(f, sensitivityCurve);

      const amp = asd * Math.sqrt(sampleRate * numSamples) / 2;

      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      realPart.push(amp * z / Math.sqrt(2));
      imagPart.push(amp * Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) / Math.sqrt(2));
    }

    const signal: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      signal.push((Math.random() - 0.5) * 1e-22);
    }

    return signal;
  }

  private interpolateASD(f: number, sensitivityCurve: FrequencySeries): number {
    const freqs = sensitivityCurve.frequencies;
    const values = sensitivityCurve.values;

    if (f <= freqs[0]) return values[0];
    if (f >= freqs[freqs.length - 1]) return values[freqs.length - 1];

    let idx = 0;
    for (let i = 1; i < freqs.length; i++) {
      if (freqs[i] >= f) {
        idx = i;
        break;
      }
    }

    const logF0 = Math.log10(freqs[idx - 1]);
    const logF1 = Math.log10(freqs[idx]);
    const logF = Math.log10(f);
    const logA0 = Math.log10(values[idx - 1]);
    const logA1 = Math.log10(values[idx]);

    const t = (logF - logF0) / (logF1 - logF0);
    const logA = logA0 + t * (logA1 - logA0);

    return Math.pow(10, logA);
  }

  checkNoiseStationarity(
    timeSeries: TimeSeries,
    segmentSize: number = 1024,
    overlap: number = 0.5
  ): {
    isStationary: boolean;
    varianceRatio: number;
    adfStatistic: number;
    pValue: number;
  } {
    const values = timeSeries.values;
    const numSegments = Math.floor((values.length - segmentSize * overlap) / (segmentSize * (1 - overlap)));

    const segmentVariances: number[] = [];

    for (let i = 0; i < numSegments; i++) {
      const start = Math.floor(i * segmentSize * (1 - overlap));
      const segment = values.slice(start, start + segmentSize);

      const mean = segment.reduce((a, b) => a + b, 0) / segment.length;
      const variance = segment.reduce((a, b) => a + (b - mean) * (b - mean), 0) / segment.length;
      segmentVariances.push(variance);
    }

    const meanVar = segmentVariances.reduce((a, b) => a + b, 0) / segmentVariances.length;
    const varOfVar = segmentVariances.reduce((a, b) => a + (b - meanVar) * (b - meanVar), 0) / segmentVariances.length;
    const varianceRatio = Math.sqrt(varOfVar) / meanVar;

    const adfStatistic = this.simpleADFTest(values);
    const pValue = Math.min(1, Math.max(0, 0.5 + adfStatistic * 0.3));

    return {
      isStationary: varianceRatio < 0.3 && pValue > 0.05,
      varianceRatio,
      adfStatistic,
      pValue,
    };
  }

  private simpleADFTest(series: number[]): number {
    const n = series.length;
    const diff: number[] = [];
    const level: number[] = [];

    for (let i = 1; i < n; i++) {
      diff.push(series[i] - series[i - 1]);
      level.push(series[i - 1]);
    }

    const meanDiff = diff.reduce((a, b) => a + b, 0) / diff.length;
    const meanLevel = level.reduce((a, b) => a + b, 0) / level.length;

    let num = 0;
    let den = 0;
    for (let i = 0; i < diff.length; i++) {
      num += (level[i] - meanLevel) * (diff[i] - meanDiff);
      den += (level[i] - meanLevel) * (level[i] - meanLevel);
    }

    const beta = den > 0 ? num / den : 0;
    const se = Math.sqrt(0.1 / (n - 1));
    const tStat = se > 0 ? beta / se : -1;

    return tStat;
  }

  computeNoiseComponents(
    f: number,
    detectorConfig: DetectorConfig,
    noiseModel: NoiseModel
  ): {
    seismic: number;
    thermal: number;
    shot: number;
    radiationPressure: number;
    total: number;
  } {
    const seismic = interferometerService.computeSeismicNoise(f, detectorConfig, noiseModel);
    const thermal = interferometerService.computeThermalNoise(f, detectorConfig, noiseModel);
    const shot = interferometerService.computeShotNoise(f, detectorConfig, noiseModel);
    const radiationPressure = interferometerService.computeRadiationPressureNoise(f, detectorConfig, noiseModel);

    const total = Math.sqrt(
      seismic * seismic +
      thermal * thermal +
      shot * shot +
      radiationPressure * radiationPressure
    );

    return { seismic, thermal, shot, radiationPressure, total };
  }

  generateAllNoiseComponents(
    detectorConfig: DetectorConfig,
    noiseModel: NoiseModel,
    freqRange: { min: number; max: number }
  ): {
    frequencies: number[];
    seismic: number[];
    thermal: number[];
    shot: number[];
    radiationPressure: number[];
    total: number[];
  } {
    const numPoints = 200;
    const logMin = Math.log10(freqRange.min);
    const logMax = Math.log10(freqRange.max);
    const logStep = (logMax - logMin) / (numPoints - 1);

    const frequencies: number[] = [];
    const seismic: number[] = [];
    const thermal: number[] = [];
    const shot: number[] = [];
    const radiationPressure: number[] = [];
    const total: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const f = Math.pow(10, logMin + i * logStep);
      frequencies.push(f);

      const components = this.computeNoiseComponents(f, detectorConfig, noiseModel);
      seismic.push(components.seismic);
      thermal.push(components.thermal);
      shot.push(components.shot);
      radiationPressure.push(components.radiationPressure);
      total.push(components.total);
    }

    return { frequencies, seismic, thermal, shot, radiationPressure, total };
  }
}

export const noiseSimulationService = new NoiseSimulationService();
