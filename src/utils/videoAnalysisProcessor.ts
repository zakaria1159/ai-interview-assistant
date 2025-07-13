// src/utils/enhancedVideoAnalysisProcessor.ts

export interface MediaPipeVideoAnalysisData {
  posture: {
    score: number;
    faceCentered: boolean;
    faceVisible: boolean;
    appropriateDistance: boolean;
    faceSize: number;
    horizontalAlignment: number;
    verticalAlignment: number;
  };
  movement: {
    score: number;
    fidgetingLevel: number;
    stability: number;
    headMovement: number;
  };
  audioQuality: {
    score: number;
    volumeLevel: number;
    clarity: number;
    consistency: number;
  };
  overall: {
    score: number;
    timestamp: number;
  };
  faceDetection: {
    detectionCount: number;
    confidence: number;
    landmarks: any[];
  };
}

export interface EnhancedVideoAnalysisResults {
  // Core scores (0-10)
  postureScore: number;
  stabilityScore: number;
  voiceQualityScore: number;
  presenceScore: number;
  professionalismScore: number;
  faceDetectionScore: number;
  overallBehavioralScore: number;

  // Enhanced breakdown with MediaPipe insights
  breakdown: {
    posture: {
      score: number;
      feedback: string;
      metrics: {
        faceCentered: boolean;
        faceVisible: boolean;
        appropriateDistance: boolean;
        avgFaceSize: number;
        avgAlignment: number;
      };
    };
    stability: {
      score: number;
      feedback: string;
      metrics: {
        avgHeadMovement: number;
        consistencyScore: number;
        fidgetingLevel: number;
      };
    };
    voiceQuality: {
      score: number;
      feedback: string;
      metrics: {
        avgVolume: number;
        avgClarity: number;
        consistency: number;
      };
    };
    presence: {
      score: number;
      feedback: string;
      metrics: {
        engagementLevel: number;
        attentiveness: number;
        confidence: number;
      };
    };
    faceDetection: {
      score: number;
      feedback: string;
      metrics: {
        detectionRate: number;
        avgConfidence: number;
        facialStability: number;
      };
    };
  };

  // Analytics and insights
  analytics: {
    totalMeasures: number;
    analysisTimeMinutes: number;
    consistencyScore: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    strengths: string[];
    improvementAreas: string[];
    mediaLiteracyTips: string[];
  };

  // MediaPipe specific insights
  faceAnalysis: {
    avgDetectionConfidence: number;
    faceStabilityScore: number;
    positionConsistency: number;
    eyeContactEstimate: number;
    professionalAppearance: number;
  };
}

export function processEnhancedVideoAnalysisData(
  analysisData: MediaPipeVideoAnalysisData[]
): EnhancedVideoAnalysisResults {
  if (!analysisData || analysisData.length === 0) {
    return getDefaultResults();
  }

  // Filter out invalid data points
  const validData = analysisData.filter(d => 
    d && 
    typeof d.overall?.score === 'number' && 
    d.overall.score >= 0 && 
    d.overall.score <= 10
  );

  if (validData.length === 0) {
    return getDefaultResults();
  }

  // Calculate core metrics
  const coreMetrics = calculateCoreMetrics(validData);
  const faceDetectionMetrics = calculateFaceDetectionMetrics(validData);
  const stabilityMetrics = calculateStabilityMetrics(validData);
  const voiceMetrics = calculateVoiceMetrics(validData);
  
  // Generate enhanced insights
  const analytics = generateAnalytics(validData, coreMetrics);
  const faceAnalysis = generateFaceAnalysis(validData);
  
  return {
    // Core scores
    postureScore: coreMetrics.posture,
    stabilityScore: coreMetrics.stability,
    voiceQualityScore: coreMetrics.voiceQuality,
    presenceScore: coreMetrics.presence,
    professionalismScore: coreMetrics.professionalism,
    faceDetectionScore: faceDetectionMetrics.score,
    overallBehavioralScore: coreMetrics.overall,

    // Enhanced breakdown
    breakdown: {
      posture: {
        score: coreMetrics.posture,
        feedback: generatePostureFeedback(validData, coreMetrics.posture),
        metrics: {
          faceCentered: calculateFaceCenteredRate(validData),
          faceVisible: calculateFaceVisibilityRate(validData),
          appropriateDistance: calculateDistanceAppropriatenessRate(validData),
          avgFaceSize: calculateAverageFaceSize(validData),
          avgAlignment: calculateAverageAlignment(validData),
        }
      },
      stability: {
        score: coreMetrics.stability,
        feedback: generateStabilityFeedback(validData, stabilityMetrics),
        metrics: {
          avgHeadMovement: stabilityMetrics.avgHeadMovement,
          consistencyScore: stabilityMetrics.consistency,
          fidgetingLevel: stabilityMetrics.avgFidgeting,
        }
      },
      voiceQuality: {
        score: coreMetrics.voiceQuality,
        feedback: generateVoiceFeedback(validData, voiceMetrics),
        metrics: {
          avgVolume: voiceMetrics.avgVolume,
          avgClarity: voiceMetrics.avgClarity,
          consistency: voiceMetrics.consistency,
        }
      },
      presence: {
        score: coreMetrics.presence,
        feedback: generatePresenceFeedback(validData, coreMetrics.presence),
        metrics: {
          engagementLevel: calculateEngagementLevel(validData),
          attentiveness: calculateAttentiveness(validData),
          confidence: calculateConfidenceLevel(validData),
        }
      },
      faceDetection: {
        score: faceDetectionMetrics.score,
        feedback: generateFaceDetectionFeedback(validData, faceDetectionMetrics),
        metrics: {
          detectionRate: faceDetectionMetrics.detectionRate,
          avgConfidence: faceDetectionMetrics.avgConfidence,
          facialStability: faceDetectionMetrics.stability,
        }
      }
    },

    analytics,
    faceAnalysis
  };
}

function calculateCoreMetrics(data: MediaPipeVideoAnalysisData[]) {
  const posture = Math.round(data.reduce((sum, d) => sum + (d.posture?.score || 0), 0) / data.length);
  const stability = Math.round(data.reduce((sum, d) => sum + (d.movement?.score || 0), 0) / data.length);
  const voiceQuality = Math.round(data.reduce((sum, d) => sum + (d.audioQuality?.score || 0), 0) / data.length);
  
  // Calculate presence based on combination of factors
  const presence = Math.round(data.reduce((sum, d) => {
    const faceVisible = d.posture?.faceVisible ? 3 : 0;
    const faceCentered = d.posture?.faceCentered ? 2 : 0;
    const goodDistance = d.posture?.appropriateDistance ? 2 : 0;
    const faceConfidence = (d.faceDetection?.confidence || 0) * 3;
    return sum + Math.min(10, faceVisible + faceCentered + goodDistance + faceConfidence);
  }, 0) / data.length);

  // Calculate professionalism based on consistency and quality
  const professionalism = Math.round((posture + stability + presence) / 3);
  
  const overall = Math.round((posture + stability + voiceQuality + presence + professionalism) / 5);

  return { posture, stability, voiceQuality, presence, professionalism, overall };
}

function calculateFaceDetectionMetrics(data: MediaPipeVideoAnalysisData[]) {
  const detectionsData = data.filter(d => d.faceDetection);
  
  if (detectionsData.length === 0) {
    return { score: 0, detectionRate: 0, avgConfidence: 0, stability: 0 };
  }

  const detectionRate = (detectionsData.filter(d => d.faceDetection.detectionCount > 0).length / detectionsData.length) * 100;
  const avgConfidence = detectionsData.reduce((sum, d) => sum + (d.faceDetection.confidence || 0), 0) / detectionsData.length;
  const stability = calculateFacialStability(detectionsData);
  
  const score = Math.round((detectionRate / 10) + (avgConfidence * 5) + (stability / 2));

  return { score: Math.min(10, score), detectionRate, avgConfidence, stability };
}

function calculateStabilityMetrics(data: MediaPipeVideoAnalysisData[]) {
  const movementData = data.filter(d => d.movement);
  
  if (movementData.length === 0) {
    return { avgHeadMovement: 0, consistency: 0, avgFidgeting: 0 };
  }

  const avgHeadMovement = movementData.reduce((sum, d) => sum + (d.movement.headMovement || 0), 0) / movementData.length;
  const avgFidgeting = movementData.reduce((sum, d) => sum + (d.movement.fidgetingLevel || 0), 0) / movementData.length;
  
  // Calculate consistency based on variance
  const stabilityScores = movementData.map(d => d.movement.stability);
  const avgStability = stabilityScores.reduce((sum, s) => sum + s, 0) / stabilityScores.length;
  const variance = stabilityScores.reduce((sum, s) => sum + Math.pow(s - avgStability, 2), 0) / stabilityScores.length;
  const consistency = Math.max(0, 10 - Math.sqrt(variance));

  return { avgHeadMovement, consistency, avgFidgeting };
}

function calculateVoiceMetrics(data: MediaPipeVideoAnalysisData[]) {
  const audioData = data.filter(d => d.audioQuality);
  
  if (audioData.length === 0) {
    return { avgVolume: 0, avgClarity: 0, consistency: 0 };
  }

  const avgVolume = audioData.reduce((sum, d) => sum + (d.audioQuality.volumeLevel || 0), 0) / audioData.length;
  const avgClarity = audioData.reduce((sum, d) => sum + (d.audioQuality.clarity || 0), 0) / audioData.length;
  const consistency = audioData.reduce((sum, d) => sum + (d.audioQuality.consistency || 0), 0) / audioData.length;

  return { avgVolume, avgClarity, consistency };
}

function generateAnalytics(data: MediaPipeVideoAnalysisData[], coreMetrics: any) {
  const totalMeasures = data.length;
  const timeSpan = data.length > 1 ? data[data.length - 1].overall.timestamp - data[0].overall.timestamp : 0;
  const analysisTimeMinutes = Math.round(timeSpan / 60000);

  // Calculate consistency across all metrics
  const allScores = data.map(d => d.overall.score);
  const avgScore = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
  const variance = allScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / allScores.length;
  const consistencyScore = Math.max(0, Math.round(10 - Math.sqrt(variance)));

  // Determine improvement trend
  let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (data.length >= 3) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.overall.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.overall.score, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.5) improvementTrend = 'improving';
    else if (secondAvg < firstAvg - 0.5) improvementTrend = 'declining';
  }

  // Generate strengths and improvement areas
  const strengths: string[] = [];
  const improvementAreas: string[] = [];
  const mediaLiteracyTips: string[] = [];

  if (coreMetrics.posture >= 8) strengths.push("Excellente posture et positionnement");
  else if (coreMetrics.posture <= 5) improvementAreas.push("Améliorer le positionnement face caméra");

  if (coreMetrics.stability >= 8) strengths.push("Très bonne stabilité et présence");
  else if (coreMetrics.stability <= 5) improvementAreas.push("Réduire les mouvements parasites");

  if (coreMetrics.voiceQuality >= 8) strengths.push("Excellente qualité vocale");
  else if (coreMetrics.voiceQuality <= 5) improvementAreas.push("Améliorer la projection vocale");

  // Add media literacy tips
  mediaLiteracyTips.push("Placez la caméra au niveau des yeux pour un contact visuel optimal");
  mediaLiteracyTips.push("Utilisez un éclairage doux et uniforme face à vous");
  mediaLiteracyTips.push("Testez votre audio avant l'entretien pour éviter les problèmes techniques");

  return {
    totalMeasures,
    analysisTimeMinutes,
    consistencyScore,
    improvementTrend,
    strengths,
    improvementAreas,
    mediaLiteracyTips
  };
}

function generateFaceAnalysis(data: MediaPipeVideoAnalysisData[]) {
  const faceData = data.filter(d => d.faceDetection && d.faceDetection.detectionCount > 0);
  
  if (faceData.length === 0) {
    return {
      avgDetectionConfidence: 0,
      faceStabilityScore: 0,
      positionConsistency: 0,
      eyeContactEstimate: 0,
      professionalAppearance: 0
    };
  }

  const avgDetectionConfidence = faceData.reduce((sum, d) => sum + d.faceDetection.confidence, 0) / faceData.length;
  const faceStabilityScore = calculateFacialStability(faceData);
  const positionConsistency = calculatePositionConsistency(faceData);
  const eyeContactEstimate = calculateEyeContactEstimate(faceData);
  const professionalAppearance = Math.round((avgDetectionConfidence * 5) + (positionConsistency / 2) + (faceStabilityScore / 2));

  return {
    avgDetectionConfidence: Math.round(avgDetectionConfidence * 100) / 100,
    faceStabilityScore: Math.round(faceStabilityScore),
    positionConsistency: Math.round(positionConsistency),
    eyeContactEstimate: Math.round(eyeContactEstimate),
    professionalAppearance: Math.min(10, professionalAppearance)
  };
}

// Helper functions
function calculateFaceCenteredRate(data: MediaPipeVideoAnalysisData[]): boolean {
  const centeredCount = data.filter(d => d.posture?.faceCentered).length;
  return centeredCount / data.length > 0.7;
}

function calculateFaceVisibilityRate(data: MediaPipeVideoAnalysisData[]): boolean {
  const visibleCount = data.filter(d => d.posture?.faceVisible).length;
  return visibleCount / data.length > 0.8;
}

function calculateDistanceAppropriatenessRate(data: MediaPipeVideoAnalysisData[]): boolean {
  const appropriateCount = data.filter(d => d.posture?.appropriateDistance).length;
  return appropriateCount / data.length > 0.7;
}

function calculateAverageFaceSize(data: MediaPipeVideoAnalysisData[]): number {
  const sizesData = data.filter(d => d.posture?.faceSize !== undefined);
  if (sizesData.length === 0) return 0;
  return Math.round((sizesData.reduce((sum, d) => sum + d.posture.faceSize, 0) / sizesData.length) * 100) / 100;
}

function calculateAverageAlignment(data: MediaPipeVideoAnalysisData[]): number {
  const alignmentData = data.filter(d => d.posture?.horizontalAlignment !== undefined);
  if (alignmentData.length === 0) return 0;
  return Math.round((alignmentData.reduce((sum, d) => sum + d.posture.horizontalAlignment, 0) / alignmentData.length) * 100) / 100;
}

function calculateFacialStability(data: MediaPipeVideoAnalysisData[]): number {
  if (data.length < 2) return 10;
  
  const movements = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].movement?.headMovement !== undefined) {
      movements.push(data[i].movement.headMovement);
    }
  }
  
  if (movements.length === 0) return 10;
  const avgMovement = movements.reduce((sum, m) => sum + m, 0) / movements.length;
  return Math.max(0, 10 - (avgMovement * 10));
}

function calculatePositionConsistency(data: MediaPipeVideoAnalysisData[]): number {
  const alignments = data.map(d => d.posture?.horizontalAlignment || 0.5);
  if (alignments.length < 2) return 10;
  
  const avg = alignments.reduce((sum, a) => sum + a, 0) / alignments.length;
  const variance = alignments.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / alignments.length;
  return Math.max(0, 10 - (Math.sqrt(variance) * 20));
}

function calculateEyeContactEstimate(data: MediaPipeVideoAnalysisData[]): number {
  // Estimate eye contact based on face centering and detection confidence
  const eyeContactData = data.filter(d => d.posture?.faceCentered && d.faceDetection?.confidence > 0.7);
  return Math.round((eyeContactData.length / data.length) * 10);
}

function calculateEngagementLevel(data: MediaPipeVideoAnalysisData[]): number {
  return Math.round(data.reduce((sum, d) => {
    let engagement = 0;
    if (d.posture?.faceVisible) engagement += 3;
    if (d.posture?.faceCentered) engagement += 3;
    if (d.faceDetection?.confidence > 0.7) engagement += 4;
    return sum + engagement;
  }, 0) / (data.length * 10) * 10);
}

function calculateAttentiveness(data: MediaPipeVideoAnalysisData[]): number {
  return Math.round(data.reduce((sum, d) => {
    const stability = d.movement?.stability || 0;
    const faceVisible = d.posture?.faceVisible ? 5 : 0;
    return sum + Math.min(10, (stability + faceVisible) / 2);
  }, 0) / data.length);
}

function calculateConfidenceLevel(data: MediaPipeVideoAnalysisData[]): number {
  return Math.round(data.reduce((sum, d) => {
    const posture = d.posture?.score || 0;
    const stability = d.movement?.stability || 0;
    const confidence = d.faceDetection?.confidence || 0;
    return sum + Math.min(10, (posture + stability + (confidence * 10)) / 3);
  }, 0) / data.length);
}

// Feedback generation functions
function generatePostureFeedback(data: MediaPipeVideoAnalysisData[], score: number): string {
  const faceVisibleRate = calculateFaceVisibilityRate(data);
  const faceCenteredRate = calculateFaceCenteredRate(data);
  const distanceRate = calculateDistanceAppropriatenessRate(data);

  if (score >= 8) {
    return "Excellente posture ! Votre positionnement face à la caméra est optimal et professionnel.";
  } else if (score >= 6) {
    return "Bonne posture générale. Quelques ajustements mineurs amélioreront votre présence à l'écran.";
  } else {
    let feedback = "Posture à améliorer : ";
    if (!faceVisibleRate) feedback += "Assurez-vous que votre visage reste visible. ";
    if (!faceCenteredRate) feedback += "Centrez-vous mieux dans le cadre. ";
    if (!distanceRate) feedback += "Ajustez votre distance à la caméra.";
    return feedback;
  }
}

function generateStabilityFeedback(data: MediaPipeVideoAnalysisData[], metrics: any): string {
  if (metrics.consistency >= 8) {
    return "Excellente stabilité ! Votre présence est calme et assurée tout au long de l'entretien.";
  } else if (metrics.avgHeadMovement > 0.3) {
    return "Réduisez les mouvements de tête. Restez plus stable pour projeter plus de confiance.";
  } else if (metrics.avgFidgeting > 7) {
    return "Évitez les gestes parasites. Une posture plus statique renforce votre professionnalisme.";
  } else {
    return "Stabilité correcte. Continuez à travailler sur la constance de votre présence.";
  }
}

function generateVoiceFeedback(data: MediaPipeVideoAnalysisData[], metrics: any): string {
  if (metrics.avgVolume < 3) {
    return "Parlez plus fort. Votre voix doit être clairement audible pour marquer votre présence.";
  } else if (metrics.avgClarity < 5) {
    return "Améliorez l'articulation. Parlez plus distinctement pour une meilleure compréhension.";
  } else if (metrics.consistency < 5) {
    return "Maintenez un niveau vocal constant. Évitez les variations trop importantes de volume.";
  } else {
    return "Bonne qualité vocale. Votre expression orale est claire et professionnelle.";
  }
}

function generatePresenceFeedback(data: MediaPipeVideoAnalysisData[], score: number): string {
  if (score >= 8) {
    return "Excellente présence à l'écran ! Vous projetez confiance et professionnalisme.";
  } else if (score >= 6) {
    return "Bonne présence générale. Quelques ajustements renforceront votre impact visuel.";
  } else {
    return "Renforcez votre présence en maintenant un contact visuel constant et une posture assurée.";
  }
}

function generateFaceDetectionFeedback(data: MediaPipeVideoAnalysisData[], metrics: any): string {
  if (metrics.detectionRate >= 90) {
    return "Détection faciale excellente ! Votre positionnement permet une analyse comportementale optimale.";
  } else if (metrics.detectionRate >= 70) {
    return "Bonne détection faciale. Maintenez votre position face à la caméra pour une analyse constante.";
  } else {
    return "Détection faciale irrégulière. Assurez-vous de rester bien visible et face à la caméra.";
  }
}

function getDefaultResults(): EnhancedVideoAnalysisResults {
  return {
    postureScore: 5,
    stabilityScore: 5,
    voiceQualityScore: 5,
    presenceScore: 5,
    professionalismScore: 5,
    faceDetectionScore: 0,
    overallBehavioralScore: 5,
    breakdown: {
      posture: {
        score: 5,
        feedback: "Données de posture non disponibles",
        metrics: {
          faceCentered: false,
          faceVisible: false,
          appropriateDistance: true,
          avgFaceSize: 0,
          avgAlignment: 0.5,
        }
      },
      stability: {
        score: 5,
        feedback: "Données de stabilité non disponibles",
        metrics: {
          avgHeadMovement: 0,
          consistencyScore: 5,
          fidgetingLevel: 0,
        }
      },
      voiceQuality: {
        score: 5,
        feedback: "Données audio non disponibles",
        metrics: {
          avgVolume: 5,
          avgClarity: 5,
          consistency: 5,
        }
      },
      presence: {
        score: 5,
        feedback: "Données de présence non disponibles",
        metrics: {
          engagementLevel: 5,
          attentiveness: 5,
          confidence: 5,
        }
      },
      faceDetection: {
        score: 0,
        feedback: "Détection faciale non disponible",
        metrics: {
          detectionRate: 0,
          avgConfidence: 0,
          facialStability: 0,
        }
      }
    },
    analytics: {
      totalMeasures: 0,
      analysisTimeMinutes: 0,
      consistencyScore: 5,
      improvementTrend: 'stable',
      strengths: [],
      improvementAreas: ['Activer l\'analyse vidéo pour des retours personnalisés'],
      mediaLiteracyTips: [
        "Placez la caméra au niveau des yeux",
        "Assurez-vous d'avoir un bon éclairage",
        "Testez votre setup avant l'entretien"
      ]
    },
    faceAnalysis: {
      avgDetectionConfidence: 0,
      faceStabilityScore: 0,
      positionConsistency: 0,
      eyeContactEstimate: 0,
      professionalAppearance: 0
    }
  };
}