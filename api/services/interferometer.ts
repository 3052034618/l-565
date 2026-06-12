import { DetectorConfig, NoiseModel, FrequencySeries } from '../../shared/types';

export class InterferometerService {
  computeSensitivityCurve(
    detectorConfig: DetectorConfig,
    noiseModel: NoiseModel,
    freqRange: { min: number; max: number } = { min: 10, max: 2000 }
  ): FrequencySeries {
    const numPoints = 500;
    const frequencies: number[] = [];
    const values: number[] = [];

    const logMin = Math.log10(freqRange.min);
    const logMax = Math.log10(freqRange.max);
    const logStep = (logMax - logMin) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const f = Math.pow(10, logMin + i * logStep);
      frequencies.push(f);

      const seismic = this.computeSeismicNoise(f, detectorConfig, noiseModel);
      const thermal = this.computeThermalNoise(f, detectorConfig, noiseModel);
      const shot = this.computeShotNoise(f, detectorConfig, noiseModel);
      const radiation = this.computeRadiationPressureNoise(f, detectorConfig, noiseModel);

      const total = Math.sqrt(
        seismic * seismic + thermal * thermal + shot * shot + radiation * radiation
      );
      values.push(total);
    }

    return { frequencies, values };
  }

  computeSeismicNoise(f: number, _config: DetectorConfig, _model: NoiseModel): number {
    const seismicLevel = 1e-19;
    const alpha = -2.0;
    return seismicLevel * Math.pow(f / 10, alpha);
  }

  computeThermalNoise(f: number, config: DetectorConfig, _model: NoiseModel): number {
    const kB = 1.38e-23;
    const T = 298;
    const m = config.mirrorMass;
    const omega0 = 2 * Math.PI * 1;
    const Q = 100;
    const omega = 2 * Math.PI * f;

    const displacementNoise = Math.sqrt(
      (4 * kB * T * omega0) / (m * Q * Math.PI * Math.pow(omega, 4))
    );

    return displacementNoise;
  }

  computeShotNoise(f: number, config: DetectorConfig, _model: NoiseModel): number {
    const hbar = 1.05e-34;
    const lambda = config.wavelength;
    const P = config.laserPower;
    const L = config.armLength;
    const c = 3e8;

    const photonFlux = P * lambda / (hbar * c * c);
    const shotNoise = Math.sqrt(2 * hbar * lambda * c / (P * L * L)) / L;

    const f0 = 100;
    return shotNoise * Math.sqrt(1 + Math.pow(f / f0, 2));
  }

  computeRadiationPressureNoise(f: number, config: DetectorConfig, _model: NoiseModel): number {
    const hbar = 1.05e-34;
    const lambda = config.wavelength;
    const P = config.laserPower;
    const L = config.armLength;
    const m = config.mirrorMass;
    const c = 3e8;

    const omega = 2 * Math.PI * f;
    const radiationPressureForce = Math.sqrt(2 * hbar * P / (lambda * c));
    const displacement = radiationPressureForce / (m * omega * omega);

    return displacement / L;
  }

  computePhotonCountStats(config: DetectorConfig, integrationTime: number = 1): {
    meanPhotonCount: number;
    photonNoise: number;
    countingVariance: number;
  } {
    const lambda = config.wavelength;
    const P = config.laserPower;
    const h = 6.626e-34;
    const c = 3e8;

    const photonEnergy = h * c / lambda;
    const meanPhotonCount = P / photonEnergy * integrationTime;
    const countingVariance = meanPhotonCount;
    const photonNoise = Math.sqrt(countingVariance) / meanPhotonCount;

    return {
      meanPhotonCount,
      photonNoise,
      countingVariance,
    };
  }

  buildInterferometerResponse(detectorConfig: DetectorConfig): {
    armLength: number;
    finesse: number;
    poleFrequency: number;
    gain: number;
  } {
    const L = detectorConfig.armLength;
    const finesse = 100;
    const c = 3e8;
    const poleFrequency = c / (4 * L * finesse);
    const gain = 2 * finesse / Math.PI;

    return {
      armLength: L,
      finesse,
      poleFrequency,
      gain,
    };
  }

  strainToVoltageTransferFunction(f: number, config: DetectorConfig): {
    magnitude: number;
    phase: number;
  } {
    const L = config.armLength;
    const lambda = config.wavelength;
    const c = 3e8;
    const finesse = 100;

    const fPole = c / (4 * L * finesse);
    const fFsr = c / (2 * L);

    const omega = 2 * Math.PI * f;
    const omegaPole = 2 * Math.PI * fPole;

    const magnitude = (2 * Math.PI * L / lambda) * (finesse / Math.PI) / Math.sqrt(1 + Math.pow(omega / omegaPole, 2));
    const phase = -Math.atan(omega / omegaPole);

    return { magnitude, phase };
  }
}

export const interferometerService = new InterferometerService();
