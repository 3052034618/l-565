import { dataStore } from './store';
import { Recommendation, FilterTemplate, ParameterRange, DetectorConfig } from '../../shared/types';

class RecommendationEngine {
  getRecommendations(detectorConfigId?: string, signalType?: string): Recommendation {
    const filterTemplates = this.generateFilterTemplates(detectorConfigId, signalType);
    const parameterRanges = this.generateParameterRanges(signalType);

    const completedTasks = dataStore.getTasks().filter(t => t.progress === 100);

    return {
      filterTemplates,
      parameterRanges,
      confidence: 0.78 + Math.min(0.15, completedTasks.length * 0.02),
      basedOnTasks: completedTasks.length,
    };
  }

  private generateFilterTemplates(
    detectorConfigId?: string,
    signalType?: string
  ): FilterTemplate[] {
    const templates: FilterTemplate[] = [
      {
        id: 'matched_filter_bbh',
        name: 'BBH 匹配滤波器',
        type: 'matched_filter',
        description: '专门针对双黑洞并合信号优化的匹配滤波器模板库',
        suitability: this.calcSuitability(signalType, 'BBH', 0.95),
        recommendedParams: {
          templateBankSize: 5000,
          lowFrequencyCutoff: 20,
          highFrequencyCutoff: 1000,
          templateOverlap: 0.97,
        },
      },
      {
        id: 'matched_filter_bns',
        name: 'BNS 匹配滤波器',
        type: 'matched_filter',
        description: '针对双中子星并合信号的长波形匹配滤波器',
        suitability: this.calcSuitability(signalType, 'BNS', 0.92),
        recommendedParams: {
          templateBankSize: 10000,
          lowFrequencyCutoff: 10,
          highFrequencyCutoff: 1500,
          templateOverlap: 0.96,
        },
      },
      {
        id: 'wiener_filter',
        name: '维纳滤波器',
        type: 'wiener',
        description: '基于噪声功率谱的线性最优滤波器，通用型好',
        suitability: 0.85,
        recommendedParams: {
          smoothingWindow: 0.1,
          adaptive: false,
          frequencyResolution: 1,
        },
      },
      {
        id: 'q_transform',
        name: 'Q-变换时频滤波器',
        type: 'q_transform',
        description: '时频分析方法，对非平稳信号有更好的鲁棒性',
        suitability: 0.78,
        recommendedParams: {
          qValue: 10,
          frequencyRange: [20, 1000],
          mismatchThreshold: 0.1,
        },
      },
      {
        id: 'adaptive_filter',
        name: '自适应卡尔曼滤波器',
        type: 'adaptive',
        description: '实时自适应滤波，适用于非平稳噪声环境',
        suitability: 0.72,
        recommendedParams: {
          processNoise: 0.01,
          measurementNoise: 0.1,
          initialCovariance: 1.0,
        },
      },
    ];

    return templates.sort((a, b) => b.suitability - a.suitability);
  }

  private calcSuitability(signalType?: string, templateType: string, baseValue: number): number {
    if (!signalType) return baseValue - 0.1;
    return signalType === templateType ? baseValue : baseValue - 0.2;
  }

  private generateParameterRanges(signalType?: string): ParameterRange[] {
    const ranges: ParameterRange[] = [];

    if (signalType === 'BBH' || !signalType) {
      ranges.push(
        { parameter: 'mass1', min: 5, max: 100, suggestedStep: 1, confidence: 0.88 },
        { parameter: 'mass2', min: 5, max: 80, suggestedStep: 1, confidence: 0.85 },
        { parameter: 'spin1', min: 0, max: 0.9, suggestedStep: 0.05, confidence: 0.72 },
        { parameter: 'spin2', min: 0, max: 0.8, suggestedStep: 0.05, confidence: 0.75 },
        { parameter: 'distance', min: 50, max: 1500, suggestedStep: 10, confidence: 0.82 },
        { parameter: 'inclination', min: 0, max: 3.14, suggestedStep: 0.1, confidence: 0.68 },
      );
    } else if (signalType === 'BNS') {
      ranges.push(
        { parameter: 'mass1', min: 1, max: 3, suggestedStep: 0.05, confidence: 0.92 },
        { parameter: 'mass2', min: 1, max: 3, suggestedStep: 0.05, confidence: 0.91 },
        { parameter: 'spin1', min: 0, max: 0.4, suggestedStep: 0.02, confidence: 0.78 },
        { parameter: 'spin2', min: 0, max: 0.4, suggestedStep: 0.02, confidence: 0.80 },
        { parameter: 'distance', min: 10, max: 300, suggestedStep: 5, confidence: 0.88 },
      );
    } else if (signalType === 'NSBH') {
      ranges.push(
        { parameter: 'mass1', min: 3, max: 30, suggestedStep: 0.5, confidence: 0.85 },
        { parameter: 'mass2', min: 1, max: 3, suggestedStep: 0.05, confidence: 0.90 },
        { parameter: 'spin1', min: 0, max: 0.9, suggestedStep: 0.05, confidence: 0.70 },
        { parameter: 'spin2', min: 0, max: 0.4, suggestedStep: 0.02, confidence: 0.76 },
        { parameter: 'distance', min: 30, max: 800, suggestedStep: 10, confidence: 0.80 },
      );
    }

    return ranges;
  }

  getOptimalSamplingRate(detectorConfig: DetectorConfig): number {
    const baseRate = 4096;
    if (detectorConfig.armLength < 2000) return 2048;
    if (detectorConfig.armLength > 8000) return 16384;
    return baseRate;
  }

  getEstimatedComputationTime(
    detectorConfigId: string,
    signalType: string,
    numSamples: number = 3000
  ): number {
    const baseTime = 60;

    const detector = dataStore.getDetectorConfigById(detectorConfigId);
    let complexityFactor = 1;

    if (detector) {
      complexityFactor = detector.laserPower / 100 * 0.5 + 0.5;
    }

    let signalFactor = 1;
    switch (signalType) {
      case 'BNS':
        signalFactor = 1.5;
        break;
      case 'NSBH':
        signalFactor = 1.2;
        break;
      case 'BBH':
        signalFactor = 1.0;
        break;
    }

    const sampleFactor = numSamples / 3000;

    return baseTime * complexityFactor * signalFactor * sampleFactor;
  }

  suggestNoiseModel(detectorConfigId: string): string {
    const detector = dataStore.getDetectorConfigById(detectorConfigId);
    if (!detector) return 'nm1';

    if (detector.laserPower > 100) return 'nm2';
    return 'nm1';
  }
}

export const recommendationEngine = new RecommendationEngine();
