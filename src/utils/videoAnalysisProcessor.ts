// src/utils/videoAnalysisProcessor.ts

interface VideoAnalysisData {
    posture: {
      score: number;
      faceCentered: boolean;
      faceVisible: boolean;
      appropriateDistance: boolean;
    };
    movement: {
      score: number;
      fidgetingLevel: number;
      stability: number;
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
  }
  
  interface ProcessedVideoAnalysis {
    // Core scores matching the question evaluation format
    postureScore: number;
    stabilityScore: number;
    voiceQualityScore: number;
    presenceScore: number;
    professionalismScore: number;
    
    // Overall behavioral score
    overallBehavioralScore: number;
    
    // Detailed breakdown
    breakdown: {
      posture: {
        score: number;
        feedback: string;
        details: string;
      };
      stability: {
        score: number;
        feedback: string;
        details: string;
      };
      voiceQuality: {
        score: number;
        feedback: string;
        details: string;
      };
      presence: {
        score: number;
        feedback: string;
        details: string;
      };
      professionalism: {
        score: number;
        feedback: string;
        details: string;
      };
    };
    
    // Analytics data
    analytics: {
      totalMeasures: number;
      analysisTimeMinutes: number;
      consistencyScore: number;
      improvementAreas: string[];
      strengths: string[];
    };
  }
  
  export function processVideoAnalysisData(videoData: VideoAnalysisData[]): ProcessedVideoAnalysis {
    if (!videoData || videoData.length === 0) {
      return createEmptyAnalysis();
    }
  
    const totalMeasures = videoData.length;
    
    // Calculate base averages
    const avgPosture = calculateAverage(videoData.map(d => d.posture.score));
    const avgMovement = calculateAverage(videoData.map(d => d.movement.score));
    const avgAudio = calculateAverage(videoData.map(d => d.audioQuality.score));
    
    // Calculate advanced metrics
    const presenceScore = calculatePresenceScore(videoData);
    const professionalismScore = calculateProfessionalismScore(videoData);
    const consistencyScore = calculateConsistencyScore(videoData);
    
    // Calculate overall behavioral score (weighted)
    const overallBehavioralScore = Math.round(
      (avgPosture * 0.25 + 
       avgMovement * 0.25 + 
       avgAudio * 0.2 + 
       presenceScore * 0.15 + 
       professionalismScore * 0.15) 
    );
  
    // Generate detailed feedback
    const breakdown = generateDetailedBreakdown({
      posture: avgPosture,
      stability: avgMovement,
      voiceQuality: avgAudio,
      presence: presenceScore,
      professionalism: professionalismScore
    }, videoData);
  
    // Calculate analytics
    const analytics = generateAnalytics(videoData, consistencyScore);
  
    return {
      postureScore: Math.round(avgPosture),
      stabilityScore: Math.round(avgMovement),
      voiceQualityScore: Math.round(avgAudio),
      presenceScore,
      professionalismScore,
      overallBehavioralScore,
      breakdown,
      analytics
    };
  }
  
  function calculateAverage(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  function calculatePresenceScore(videoData: VideoAnalysisData[]): number {
    const faceVisibleCount = videoData.filter(d => d.posture.faceVisible).length;
    const faceCenteredCount = videoData.filter(d => d.posture.faceCentered).length;
    const appropriateDistanceCount = videoData.filter(d => d.posture.appropriateDistance).length;
    
    const presenceRatio = (faceVisibleCount + faceCenteredCount + appropriateDistanceCount) / (videoData.length * 3);
    return Math.round(presenceRatio * 10);
  }
  
  function calculateProfessionalismScore(videoData: VideoAnalysisData[]): number {
    const avgPosture = calculateAverage(videoData.map(d => d.posture.score));
    const avgStability = calculateAverage(videoData.map(d => d.movement.stability));
    const avgAudioConsistency = calculateAverage(videoData.map(d => d.audioQuality.consistency));
    
    return Math.round((avgPosture + avgStability + avgAudioConsistency) / 3);
  }
  
  function calculateConsistencyScore(videoData: VideoAnalysisData[]): number {
    const overallScores = videoData.map(d => d.overall.score);
    const mean = calculateAverage(overallScores);
    const variance = overallScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / overallScores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to 0-10 scale (lower std dev = higher consistency)
    const consistencyScore = Math.max(0, 10 - (standardDeviation * 2));
    return Math.round(consistencyScore);
  }
  
  function generateDetailedBreakdown(scores: {
    posture: number;
    stability: number;
    voiceQuality: number;
    presence: number;
    professionalism: number;
  }, videoData: VideoAnalysisData[]) {
    return {
      posture: {
        score: Math.round(scores.posture),
        feedback: getPostureFeedback(scores.posture, videoData),
        details: getPostureDetails(videoData)
      },
      stability: {
        score: Math.round(scores.stability),
        feedback: getStabilityFeedback(scores.stability, videoData),
        details: getStabilityDetails(videoData)
      },
      voiceQuality: {
        score: Math.round(scores.voiceQuality),
        feedback: getVoiceFeedback(scores.voiceQuality, videoData),
        details: getVoiceDetails(videoData)
      },
      presence: {
        score: Math.round(scores.presence),
        feedback: getPresenceFeedback(scores.presence, videoData),
        details: getPresenceDetails(videoData)
      },
      professionalism: {
        score: Math.round(scores.professionalism),
        feedback: getProfessionalismFeedback(scores.professionalism),
        details: getProfessionalismDetails(videoData)
      }
    };
  }
  
  function generateAnalytics(videoData: VideoAnalysisData[], consistencyScore: number) {
    const firstTimestamp = videoData[0]?.overall.timestamp || 0;
    const lastTimestamp = videoData[videoData.length - 1]?.overall.timestamp || 0;
    const analysisTimeMinutes = Math.round((lastTimestamp - firstTimestamp) / 1000 / 60);
    
    const improvementAreas: string[] = [];
    const strengths: string[] = [];
    
    const avgScores = {
      posture: calculateAverage(videoData.map(d => d.posture.score)),
      movement: calculateAverage(videoData.map(d => d.movement.score)),
      audio: calculateAverage(videoData.map(d => d.audioQuality.score))
    };
    
    // Identify improvement areas and strengths
    Object.entries(avgScores).forEach(([area, score]) => {
      if (score >= 8) {
        strengths.push(getStrengthMessage(area));
      } else if (score < 6) {
        improvementAreas.push(getImprovementMessage(area));
      }
    });
    
    return {
      totalMeasures: videoData.length,
      analysisTimeMinutes,
      consistencyScore,
      improvementAreas,
      strengths
    };
  }
  
  // Feedback generation functions
  function getPostureFeedback(score: number, videoData: VideoAnalysisData[]): string {
    if (score >= 8) return "Excellente posture professionnelle maintenue tout au long de l'entretien";
    if (score >= 6) return "Bonne posture générale avec quelques ajustements possibles";
    if (score >= 4) return "Posture acceptable mais nécessite des améliorations";
    return "Posture à retravailler pour une meilleure présentation professionnelle";
  }
  
  function getStabilityFeedback(score: number, videoData: VideoAnalysisData[]): string {
    const avgFidgeting = calculateAverage(videoData.map(d => d.movement.fidgetingLevel));
    
    if (score >= 8) return "Excellente maîtrise des mouvements et stabilité remarquable";
    if (score >= 6) return "Bonne stabilité avec quelques mouvements mineurs";
    if (score >= 4) return "Stabilité moyenne, réduire les mouvements parasites";
    return `Nombreux mouvements parasites détectés (niveau ${Math.round(avgFidgeting)}/10)`;
  }
  
  function getVoiceFeedback(score: number, videoData: VideoAnalysisData[]): string {
    const avgVolume = calculateAverage(videoData.map(d => d.audioQuality.volumeLevel));
    const avgClarity = calculateAverage(videoData.map(d => d.audioQuality.clarity));
    
    if (score >= 8) return "Excellente qualité vocale avec volume et clarté optimaux";
    if (score >= 6) return "Bonne qualité audio générale";
    if (score >= 4) return `Qualité audio acceptable (volume: ${Math.round(avgVolume)}/10, clarté: ${Math.round(avgClarity)}/10)`;
    return "Qualité audio insuffisante - améliorer le volume et la clarté";
  }
  
  function getPresenceFeedback(score: number, videoData: VideoAnalysisData[]): string {
    const visibilityRate = (videoData.filter(d => d.posture.faceVisible).length / videoData.length) * 100;
    
    if (score >= 8) return `Excellente présence à l'écran (${Math.round(visibilityRate)}% de visibilité)`;
    if (score >= 6) return "Bonne présence générale avec quelques ajustements";
    if (score >= 4) return "Présence acceptable mais peut être améliorée";
    return "Présence insuffisante - vérifier le cadrage et l'éclairage";
  }
  
  function getProfessionalismFeedback(score: number): string {
    if (score >= 8) return "Présentation très professionnelle et confiance remarquable";
    if (score >= 6) return "Bon niveau de professionnalisme";
    if (score >= 4) return "Professionnalisme acceptable avec des améliorations possibles";
    return "Niveau de professionnalisme à améliorer";
  }
  
  // Detail generation functions
  function getPostureDetails(videoData: VideoAnalysisData[]): string {
    const faceVisibleRate = Math.round((videoData.filter(d => d.posture.faceVisible).length / videoData.length) * 100);
    const faceCenteredRate = Math.round((videoData.filter(d => d.posture.faceCentered).length / videoData.length) * 100);
    const distanceRate = Math.round((videoData.filter(d => d.posture.appropriateDistance).length / videoData.length) * 100);
    
    return `Visage visible: ${faceVisibleRate}% • Centré: ${faceCenteredRate}% • Distance appropriée: ${distanceRate}%`;
  }
  
  function getStabilityDetails(videoData: VideoAnalysisData[]): string {
    const avgFidgeting = Math.round(calculateAverage(videoData.map(d => d.movement.fidgetingLevel)));
    const avgStability = Math.round(calculateAverage(videoData.map(d => d.movement.stability)));
    
    return `Niveau d'agitation moyen: ${avgFidgeting}/10 • Stabilité générale: ${avgStability}/10`;
  }
  
  function getVoiceDetails(videoData: VideoAnalysisData[]): string {
    const avgVolume = Math.round(calculateAverage(videoData.map(d => d.audioQuality.volumeLevel)));
    const avgClarity = Math.round(calculateAverage(videoData.map(d => d.audioQuality.clarity)));
    const avgConsistency = Math.round(calculateAverage(videoData.map(d => d.audioQuality.consistency)));
    
    return `Volume moyen: ${avgVolume}/10 • Clarté: ${avgClarity}/10 • Consistance: ${avgConsistency}/10`;
  }
  
  function getPresenceDetails(videoData: VideoAnalysisData[]): string {
    const visibilityRate = Math.round((videoData.filter(d => d.posture.faceVisible).length / videoData.length) * 100);
    const centeringRate = Math.round((videoData.filter(d => d.posture.faceCentered).length / videoData.length) * 100);
    
    return `Visibilité: ${visibilityRate}% • Centrage: ${centeringRate}% • ${videoData.length} mesures`;
  }
  
  function getProfessionalismDetails(videoData: VideoAnalysisData[]): string {
    const avgPosture = Math.round(calculateAverage(videoData.map(d => d.posture.score)));
    const avgStability = Math.round(calculateAverage(videoData.map(d => d.movement.stability)));
    
    return `Posture moyenne: ${avgPosture}/10 • Stabilité: ${avgStability}/10 • Performance constante`;
  }
  
  function getStrengthMessage(area: string): string {
    const messages = {
      posture: "Excellente posture et présentation professionnelle",
      movement: "Très bonne maîtrise des mouvements et stabilité",
      audio: "Qualité vocale remarquable et claire"
    };
    return messages[area as keyof typeof messages] || "Performance excellente";
  }
  
  function getImprovementMessage(area: string): string {
    const messages = {
      posture: "Améliorer le positionnement face à la caméra",
      movement: "Réduire les mouvements parasites et fidgeting",
      audio: "Travailler le volume et la clarté de la voix"
    };
    return messages[area as keyof typeof messages] || "Amélioration nécessaire";
  }
  
  function createEmptyAnalysis(): ProcessedVideoAnalysis {
    return {
      postureScore: 0,
      stabilityScore: 0,
      voiceQualityScore: 0,
      presenceScore: 0,
      professionalismScore: 0,
      overallBehavioralScore: 0,
      breakdown: {
        posture: {
          score: 0,
          feedback: "Aucune donnée disponible",
          details: "Analyse vidéo non effectuée"
        },
        stability: {
          score: 0,
          feedback: "Aucune donnée disponible",
          details: "Analyse de mouvement non effectuée"
        },
        voiceQuality: {
          score: 0,
          feedback: "Aucune donnée disponible",
          details: "Analyse audio non effectuée"
        },
        presence: {
          score: 0,
          feedback: "Aucune donnée disponible",
          details: "Analyse de présence non effectuée"
        },
        professionalism: {
          score: 0,
          feedback: "Aucune donnée disponible",
          details: "Évaluation professionnelle non effectuée"
        }
      },
      analytics: {
        totalMeasures: 0,
        analysisTimeMinutes: 0,
        consistencyScore: 0,
        improvementAreas: ["Activer l'analyse vidéo pour obtenir des recommandations"],
        strengths: []
      }
    };
  }
  
  // Additional utility functions for enhanced analysis
  
  /**
   * Calculate trend analysis for video metrics over time
   */
  export function calculateTrendAnalysis(videoData: VideoAnalysisData[]): {
    postureTrend: 'stable' | 'improving' | 'declining';
    movementTrend: 'stable' | 'improving' | 'declining';
    audioTrend: 'stable' | 'improving' | 'declining';
    overallTrend: 'stable' | 'improving' | 'declining';
  } {
    if (videoData.length < 3) {
      return {
        postureTrend: 'stable',
        movementTrend: 'stable',
        audioTrend: 'stable',
        overallTrend: 'stable'
      };
    }
  
    const firstHalf = videoData.slice(0, Math.floor(videoData.length / 2));
    const secondHalf = videoData.slice(Math.floor(videoData.length / 2));
  
    const firstHalfAvg = {
      posture: calculateAverage(firstHalf.map(d => d.posture.score)),
      movement: calculateAverage(firstHalf.map(d => d.movement.score)),
      audio: calculateAverage(firstHalf.map(d => d.audioQuality.score))
    };
  
    const secondHalfAvg = {
      posture: calculateAverage(secondHalf.map(d => d.posture.score)),
      movement: calculateAverage(secondHalf.map(d => d.movement.score)),
      audio: calculateAverage(secondHalf.map(d => d.audioQuality.score))
    };
  
    const getTrend = (first: number, second: number): 'stable' | 'improving' | 'declining' => {
      const diff = second - first;
      if (Math.abs(diff) < 0.5) return 'stable';
      return diff > 0 ? 'improving' : 'declining';
    };
  
    return {
      postureTrend: getTrend(firstHalfAvg.posture, secondHalfAvg.posture),
      movementTrend: getTrend(firstHalfAvg.movement, secondHalfAvg.movement),
      audioTrend: getTrend(firstHalfAvg.audio, secondHalfAvg.audio),
      overallTrend: getTrend(
        (firstHalfAvg.posture + firstHalfAvg.movement + firstHalfAvg.audio) / 3,
        (secondHalfAvg.posture + secondHalfAvg.movement + secondHalfAvg.audio) / 3
      )
    };
  }
  
  /**
   * Generate performance insights based on video analysis data
   */
  export function generatePerformanceInsights(videoData: VideoAnalysisData[]): string[] {
    const insights: string[] = [];
    
    if (videoData.length === 0) {
      return ["Aucune donnée vidéo disponible pour générer des insights"];
    }
  
    const processed = processVideoAnalysisData(videoData);
    const trends = calculateTrendAnalysis(videoData);
  
    // Posture insights
    if (processed.postureScore >= 8) {
      insights.push("🎯 Excellente présentation visuelle tout au long de l'entretien");
    } else if (processed.postureScore < 5) {
      insights.push("📐 Améliorer le positionnement face caméra pour une meilleure présence");
    }
  
    // Movement insights
    if (processed.stabilityScore >= 8) {
      insights.push("🧘 Très bonne maîtrise du langage corporel et stabilité");
    } else if (processed.stabilityScore < 5) {
      const avgFidgeting = calculateAverage(videoData.map(d => d.movement.fidgetingLevel));
      if (avgFidgeting > 6) {
        insights.push("⚡ Réduire les mouvements parasites pour projeter plus de confiance");
      }
    }
  
    // Audio insights
    if (processed.voiceQualityScore >= 8) {
      insights.push("🎙️ Excellente qualité vocale et clarté d'élocution");
    } else if (processed.voiceQualityScore < 5) {
      const avgVolume = calculateAverage(videoData.map(d => d.audioQuality.volumeLevel));
      if (avgVolume < 4) {
        insights.push("🔊 Augmenter le volume de voix pour une meilleure présence");
      }
      const avgClarity = calculateAverage(videoData.map(d => d.audioQuality.clarity));
      if (avgClarity < 5) {
        insights.push("🗣️ Améliorer l'articulation et la clarté de l'élocution");
      }
    }
  
    // Trend insights
    if (trends.postureTrend === 'improving') {
      insights.push("📈 Amélioration progressive de la posture pendant l'entretien");
    } else if (trends.postureTrend === 'declining') {
      insights.push("📉 Attention à maintenir une bonne posture sur la durée");
    }
  
    if (trends.overallTrend === 'improving') {
      insights.push("🚀 Performance comportementale en amélioration continue");
    }
  
    // Consistency insights
    if (processed.analytics.consistencyScore >= 8) {
      insights.push("🎯 Excellente régularité dans la performance comportementale");
    } else if (processed.analytics.consistencyScore < 5) {
      insights.push("⚖️ Travailler la consistance pour une présentation plus uniforme");
    }
  
    // Duration insights
    if (processed.analytics.analysisTimeMinutes > 0) {
      if (processed.analytics.analysisTimeMinutes < 2) {
        insights.push("⏱️ Analyse de courte durée - données limitées");
      } else if (processed.analytics.analysisTimeMinutes > 10) {
        insights.push("📊 Analyse approfondie sur une durée significative");
      }
    }
  
    return insights.length > 0 ? insights : ["Analyse en cours - insights disponibles prochainement"];
  }
  
  /**
   * Compare performance against benchmarks
   */
  export function compareToBenchmarks(videoData: VideoAnalysisData[]) {
    const processed = processVideoAnalysisData(videoData);
    
    // Industry benchmarks (these could be configurable)
    const benchmarks = {
      posture: 7.0,
      stability: 6.5,
      voiceQuality: 6.0,
      presence: 7.5,
      professionalism: 7.0
    };
  
    return {
      postureComparison: processed.postureScore - benchmarks.posture,
      stabilityComparison: processed.stabilityScore - benchmarks.stability,
      voiceQualityComparison: processed.voiceQualityScore - benchmarks.voiceQuality,
      presenceComparison: processed.presenceScore - benchmarks.presence,
      professionalismComparison: processed.professionalismScore - benchmarks.professionalism,
      overallComparison: processed.overallBehavioralScore - ((benchmarks.posture + benchmarks.stability + benchmarks.voiceQuality + benchmarks.presence + benchmarks.professionalism) / 5)
    };
  }
  
  /**
   * Generate actionable recommendations based on analysis
   */
  export function generateActionableRecommendations(videoData: VideoAnalysisData[]): {
    immediate: string[];
    longTerm: string[];
  } {
    const processed = processVideoAnalysisData(videoData);
    const immediate: string[] = [];
    const longTerm: string[] = [];
  
    // Immediate recommendations (can be applied right away)
    if (processed.postureScore < 6) {
      immediate.push("Ajustez votre position pour être bien centré dans le cadre");
      immediate.push("Vérifiez votre éclairage et la distance à la caméra");
    }
  
    if (processed.stabilityScore < 6) {
      immediate.push("Posez vos mains de manière stable pour réduire les mouvements");
      immediate.push("Prenez quelques respirations profondes avant de répondre");
    }
  
    if (processed.voiceQualityScore < 6) {
      immediate.push("Parlez un peu plus fort et plus distinctement");
      immediate.push("Vérifiez votre équipement audio et l'environnement sonore");
    }
  
    // Long-term recommendations (require practice)
    if (processed.overallBehavioralScore < 7) {
      longTerm.push("Pratiquer des entretiens vidéo pour améliorer la présence à l'écran");
      longTerm.push("Travailler la gestuelle et l'expression corporelle");
    }
  
    if (processed.analytics.consistencyScore < 6) {
      longTerm.push("Développer des techniques de gestion du stress pour plus de régularité");
      longTerm.push("S'exercer à maintenir une performance stable sur la durée");
    }
  
    const trends = calculateTrendAnalysis(videoData);
    if (trends.overallTrend === 'declining') {
      longTerm.push("Travailler l'endurance pour maintenir le niveau sur des entretiens longs");
    }
  
    return { immediate, longTerm };
  }
  
  // Export the main processing function and all utility functions
  export type { VideoAnalysisData, ProcessedVideoAnalysis };