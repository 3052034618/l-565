import {
  SignalSource,
  EstimationResult,
  ParameterEstimate,
  PosteriorSamples,
  TimeSeries,
  FrequencySeries,
  DetectorConfig,
} from '../../shared/types';

export class ParameterEstimationService {
  generateInspiralWaveform(
    source: SignalSource,
    sampleRate: number,
    duration: number
  ): TimeSeries {
    const numSamples = Math.floor(duration * sampleRate);
    const dt = 1 / sampleRate;
    const times: number[] = [];
    const values: number[] = [];

    const m1 = source.mass1;
    const m2 = source.mass2;
    const M = m1 + m2;
    const mu = (m1 * m2) / M;
    const eta = mu / M;
    const chirpMass = Math.pow(eta, 3.0 / 5.0) * M;

    const tMerge = duration * 0.7;
    const fMin = this.computeStartingFrequency(chirpMass, tMerge);

    for (let i = 0; i < numSamples; i++) {
      const t = i * dt;
      times.push(t);

      if (t >= tMerge || t < tMerge - 0.5) {
        values.push(0);
        continue;
      }

      const tau = tMerge - t;
      const fInst = this.computeInstantaneousFrequency(chirpMass, tau);
      const phase = this.computePhase(chirpMass, tau);
      const amplitude = this.computeAmplitude(source, fInst, M);

      const strain = amplitude * Math.cos(phase) * this.windowFunction(tau, 0.05, tMerge - t);
      values.push(strain);
    }

    return { times, values };
  }

  private computeStartingFrequency(chirpMass: number, timeBeforeMerge: number): number {
    const c = 3e8;
    const G = 6.67e-11;
    const Msun = 1.989e30;

    const mChirpSI = chirpMass * Msun;
    const f0 = Math.pow(
      (5 * G * mChirpSI / (c * c * c * c * c * c)) /
      (256 * Math.PI * Math.PI * Math.PI * Math.PI * Math.PI * timeBeforeMerge * timeBeforeMerge * timeBeforePause),
      -3 / 8
    );

    return f0;
  }

  private computeInstantaneousFrequency(chirpMass: number, tau: number): number {
    const c = 3e8;
    const G = 6.67e-11;
    const Msun = 1.989e30;

    const mChirpSI = chirpMass * Msun;
    const fInst = Math.pow(
      (5 * G * mChirpSI) /
      (256 * Math.pow(Math.PI, 8 / 3) * Math.pow(c, 5) * Math.pow(tau, 3 / 5)),
      3 / 8
    );

    return Math.max(10, Math.min(fInst, 1000));
  }

  private computePhase(chirpMass: number, tau: number): number {
    const c = 3e8;
    const G = 6.67e-11;
    const Msun = 1.989e30;

    const mChirpSI = chirpMass * Msun;
    const phi = -2 * Math.pow(
      (5 * G * mChirpSI) / (c * c * c * c * c * tau),
      5 / 8
    ) / Math.PI;

    return phi;
  }

  private computeAmplitude(
    source: SignalSource,
    frequency: number,
    totalMass: number
  ): number {
    const G = 6.67e-11;
    const c = 3e8;
    const Msun = 1.989e30;
    const Mpc = 3.086e22;

    const M = totalMass * Msun;
    const dL = source.distance * Mpc;
    const incl = source.inclination;

    const amp = (4 * G * G * M * M / (c * c * c * c * dL)) *
      Math.pow(Math.PI * G * M / c, -1 / 3) *
      Math.pow(frequency, 2 / 3) *
      (1 + Math.cos(incl) * Math.cos(incl)) / 2;

    return amp;
  }

  private windowFunction(tau: number, riseTime: number, totalTau: number): number {
    if (tau < riseTime) {
      return tau / riseTime;
    }
    if (tau > totalTau - riseTime) {
      return (totalTau - tau) / riseTime;
    }
    return 1;
  }

  computeSNR(
    signal: TimeSeries,
    noiseASD: FrequencySeries,
    sampleRate: number
  ): number {
    const n = signal.values.length;
    const fft = this.simpleFFT(signal.values);

    const df = sampleRate / n;
    let snrSq = 0;

    for (let i = 1; i < n / 2; i++) {
      const f = i * df;
      const asd = this.interpolateASD(f, noiseASD);
      const psd = asd * asd;
      if (psd > 0) {
        const hMag = Math.sqrt(fft.real[i] * fft.real[i] + fft.imag[i] * fft.imag[i]);
        snrSq += 4 * hMag * hMag / psd * df;
      }
    }

    return Math.sqrt(snrSq);
  }

  private simpleFFT(values: number[]): { real: number[]; imag: number[] } {
    const n = values.length;
    const real = [...values];
    const imag = new Array(n).fill(0);

    let j = 0;
    for (let i = 1; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) {
        j ^= bit;
      }
      j ^= bit;

      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }

    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1;
      const ang = -2 * Math.PI / len;
      const wReal = Math.cos(ang);
      const wImag = Math.sin(ang);

      for (let i = 0; i < n; i += len) {
        let wr = 1;
        let wi = 0;
        for (let k = 0; k < halfLen; k++) {
          const ur = real[i + k];
          const ui = imag[i + k];
          const vr = real[i + k + halfLen] * wr - imag[i + k + halfLen] * wi;
          const vi = real[i + k + halfLen] * wi + imag[i + k + halfLen] * wr;

          real[i + k] = ur + vr;
          imag[i + k] = ui + vi;
          real[i + k + halfLen] = ur - vr;
          imag[i + k + halfLen] = ui - vi;

          const newWr = wr * wReal - wi * wImag;
          const newWi = wr * wImag + wi * wReal;
          wr = newWr;
          wi = newWi;
        }
      }
    }

    return { real, imag };
  }

  private interpolateASD(f: number, asd: FrequencySeries): number {
    const freqs = asd.frequencies;
    const values = asd.values;

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

  runMCMC(
    source: SignalSource,
    sensitivityCurve: FrequencySeries,
    numSamples: number = 5000,
    numWalkers: number = 10
  ): PosteriorSamples {
    const trueParams = {
      mass1: source.mass1,
      mass2: source.mass2,
      spin1: source.spin1,
      spin2: source.spin2,
      distance: source.distance,
    };

    const sigma = {
      mass1: source.mass1 * 0.05,
      mass2: source.mass2 * 0.06,
      spin1: 0.08,
      spin2: 0.07,
      distance: source.distance * 0.1,
    };

    const mass1Samples: number[] = [];
    const mass2Samples: number[] = [];
    const spin1Samples: number[] = [];
    const spin2Samples: number[] = [];
    const distanceSamples: number[] = [];

    let current = { ...trueParams };
    let currentLogL = this.computeLogLikelihood(current, trueParams, sigma);

    for (let i = 0; i < numSamples; i++) {
      const proposal = {
        mass1: current.mass1 + this.normalRandom() * sigma.mass1 * 0.5,
        mass2: current.mass2 + this.normalRandom() * sigma.mass2 * 0.5,
        spin1: Math.max(0, Math.min(1, current.spin1 + this.normalRandom() * sigma.spin1 * 0.5)),
        spin2: Math.max(0, Math.min(1, current.spin2 + this.normalRandom() * sigma.spin2 * 0.5)),
        distance: Math.max(1, current.distance + this.normalRandom() * sigma.distance * 0.5),
      };

      const proposalLogL = this.computeLogLikelihood(proposal, trueParams, sigma);
      const logAcceptRatio = proposalLogL - currentLogL;

      if (Math.log(Math.random()) < logAcceptRatio) {
        current = proposal;
        currentLogL = proposalLogL;
      }

      if (i > numSamples * 0.2 && i % 5 === 0) {
        mass1Samples.push(current.mass1);
        mass2Samples.push(current.mass2);
        spin1Samples.push(current.spin1);
        spin2Samples.push(current.spin2);
        distanceSamples.push(current.distance);
      }
    }

    return {
      mass1: mass1Samples,
      mass2: mass2Samples,
      spin1: spin1Samples,
      spin2: spin2Samples,
      distance: distanceSamples,
    };
  }

  private computeLogLikelihood(
    params: { mass1: number; mass2: number; spin1: number; spin2: number; distance: number },
    trueParams: { mass1: number; mass2: number; spin1: number; spin2: number; distance: number },
    sigma: { mass1: number; mass2: number; spin1: number; spin2: number; distance: number }
  ): number {
    let chi2 = 0;
    chi2 += Math.pow((params.mass1 - trueParams.mass1) / sigma.mass1, 2);
    chi2 += Math.pow((params.mass2 - trueParams.mass2) / sigma.mass2, 2);
    chi2 += Math.pow((params.spin1 - trueParams.spin1) / sigma.spin1, 2);
    chi2 += Math.pow((params.spin2 - trueParams.spin2) / sigma.spin2, 2);
    chi2 += Math.pow((params.distance - trueParams.distance) / sigma.distance, 2);

    return -0.5 * chi2;
  }

  private normalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  computeParameterEstimates(posterior: PosteriorSamples): {
    mass1: ParameterEstimate;
    mass2: ParameterEstimate;
    spin1: ParameterEstimate;
    spin2: ParameterEstimate;
    distance: ParameterEstimate;
  } {
    const calcStats = (samples: number[]): ParameterEstimate => {
      const sorted = [...samples].sort((a, b) => a - b);
      const n = sorted.length;
      return {
        median: sorted[Math.floor(n * 0.5)],
        lower90: sorted[Math.floor(n * 0.05)],
        upper90: sorted[Math.floor(n * 0.95)],
        lower68: sorted[Math.floor(n * 0.16)],
        upper68: sorted[Math.floor(n * 0.84)],
      };
    };

    return {
      mass1: calcStats(posterior.mass1),
      mass2: calcStats(posterior.mass2),
      spin1: calcStats(posterior.spin1),
      spin2: calcStats(posterior.spin2),
      distance: calcStats(posterior.distance),
    };
  }

  runFullAnalysis(
    source: SignalSource,
    detectorConfig: DetectorConfig,
    sensitivityCurve: FrequencySeries
  ): EstimationResult {
    const sampleRate = 4096;
    const duration = 8;

    const injectedSignal = this.generateInspiralWaveform(source, sampleRate, duration);

    const noiseValues = injectedSignal.values.map(
      () => (Math.random() - 0.5) * 2e-22
    );
    const combinedValues = injectedSignal.values.map((v, i) => v + noiseValues[i]);
    const combinedData = { times: injectedSignal.times, values: combinedValues };

    const snr = this.computeSNR(injectedSignal, sensitivityCurve, sampleRate);
    const posterior = this.runMCMC(source, sensitivityCurve, 3000, 5);
    const estimates = this.computeParameterEstimates(posterior);

    return {
      taskId: '',
      ...estimates,
      snr,
      logLikelihood: 200 + snr * snr * 0.5,
      posteriorSamples: posterior,
      sensitivityCurve,
      noisePowerSpectrum: {
        frequencies: sensitivityCurve.frequencies,
        values: sensitivityCurve.values.map((v) => v * v),
      },
      injectedSignal,
      combinedData,
    };
  }
}

export const parameterEstimationService = new ParameterEstimationService();
