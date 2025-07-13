// src/components/results/VideoAnalysisResults.tsx
// Updated component with MediaPipe support and backward compatibility

import React from 'react';

// Backward-compatible interface for video analysis data
interface VideoAnalysisData {
  posture: {
    score: number;
    faceCentered: boolean;
    faceVisible: boolean;
    appropriateDistance: boolean;
    faceSize?: number;              // Optional for backward compatibility
    horizontalAlignment?: number;   // Optional for backward compatibility  
    verticalAlignment?: number;     // Optional for backward compatibility
  };
  movement: {
    score: number;
    fidgetingLevel: number;
    stability: number;
    headMovement?: number;          // Optional for backward compatibility
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
  faceDetection?: {                 // NEW: Optional MediaPipe data
    detectionCount: number;
    confidence: number;
    landmarks: any[];
    realMediaPipe?: boolean;        // Flag to identify real vs mock data
  };
}

// Processed analysis results interface
interface ProcessedVideoAnalysis {
  postureScore: number;
  stabilityScore: number;
  voiceQualityScore: number;
  presenceScore: number;
  professionalismScore: number;
  overallBehavioralScore: number;
  breakdown: {
    posture: {
      score: number;
      feedback: string;
      metrics: any;
    };
    stability: {
      score: number;
      feedback: string;
      metrics: any;
    };
    voiceQuality: {
      score: number;
      feedback: string;
      metrics: any;
    };
    presence: {
      score: number;
      feedback: string;
      metrics: any;
    };
  };
  analytics: {
    totalMeasures: number;
    analysisTimeMinutes: number;
    consistencyScore: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    strengths: string[];
    improvementAreas: string[];
    mediaLiteracyTips: string[];
  };
  faceAnalysis?: {
    avgDetectionConfidence: number;
    mediaLiteracyLevel: number;
  };
}

// Backward-compatible processor function
export function processVideoAnalysisDataCompatible(videoAnalysisData: VideoAnalysisData[]): ProcessedVideoAnalysis {
  if (!videoAnalysisData || videoAnalysisData.length === 0) {
    return {
      postureScore: 0,
      stabilityScore: 0,
      voiceQualityScore: 0,
      presenceScore: 0,
      professionalismScore: 0,
      overallBehavioralScore: 0,
      breakdown: {
        posture: { score: 0, feedback: 'Données non disponibles', metrics: {} },
        stability: { score: 0, feedback: 'Données non disponibles', metrics: {} },
        voiceQuality: { score: 0, feedback: 'Données non disponibles', metrics: {} },
        presence: { score: 0, feedback: 'Données non disponibles', metrics: {} }
      },
      analytics: {
        totalMeasures: 0,
        analysisTimeMinutes: 0,
        consistencyScore: 0,
        improvementTrend: 'stable' as const,
        strengths: [],
        improvementAreas: ['Aucune donnée d\'analyse disponible'],
        mediaLiteracyTips: []
      }
    };
  }

  console.log('📊 Processing video analysis data:', videoAnalysisData.length, 'items');

  // Calculate scores (works with both old and new format)
  const postureScore = Math.round(
    videoAnalysisData.reduce((sum, d) => sum + (d.posture?.score || 0), 0) / videoAnalysisData.length
  );
  
  const stabilityScore = Math.round(
    videoAnalysisData.reduce((sum, d) => sum + (d.movement?.score || 0), 0) / videoAnalysisData.length
  );
  
  const voiceQualityScore = Math.round(
    videoAnalysisData.reduce((sum, d) => sum + (d.audioQuality?.score || 0), 0) / videoAnalysisData.length
  );

  // Calculate presence score with MediaPipe enhancement
  const presenceScore = Math.round(
    videoAnalysisData.reduce((sum, d) => {
      let score = 0;
      if (d.posture?.faceVisible) score += 3;
      if (d.posture?.faceCentered) score += 3;
      if (d.posture?.appropriateDistance) score += 2;
      // MediaPipe bonus if available
      if (d.faceDetection?.confidence && d.faceDetection.confidence > 0.7) score += 2;
      return sum + Math.min(10, score);
    }, 0) / videoAnalysisData.length
  );

  const professionalismScore = Math.round((postureScore + stabilityScore + presenceScore) / 3);
  const overallBehavioralScore = Math.round((postureScore + stabilityScore + voiceQualityScore + presenceScore) / 4);

  // Generate feedback based on scores
  const generateFeedback = (score: number, type: string) => {
    if (score >= 8) return `Excellente ${type.toLowerCase()} ! Votre performance est remarquable.`;
    if (score >= 6) return `Bonne ${type.toLowerCase()}. Quelques ajustements mineurs possibles.`;
    if (score >= 4) return `${type} correcte avec des axes d'amélioration identifiés.`;
    return `${type} à améliorer pour une meilleure présence professionnelle.`;
  };

  // Calculate analytics
  const timeSpan = videoAnalysisData.length > 1 ? 
    videoAnalysisData[videoAnalysisData.length - 1].overall.timestamp - videoAnalysisData[0].overall.timestamp : 0;
  const analysisTimeMinutes = Math.round(timeSpan / 60000);

  // Check for MediaPipe data
  const hasMediaPipeData = videoAnalysisData.some(d => d.faceDetection?.realMediaPipe === true);
  const mediaPipeCount = videoAnalysisData.filter(d => d.faceDetection?.realMediaPipe === true).length;

  // Calculate improvement trend
  let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (videoAnalysisData.length > 2) {
    const firstHalf = videoAnalysisData.slice(0, Math.floor(videoAnalysisData.length / 2));
    const secondHalf = videoAnalysisData.slice(Math.floor(videoAnalysisData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.overall.score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.overall.score, 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg + 0.5) improvementTrend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 0.5) improvementTrend = 'declining';
  }

  // Generate strengths and improvement areas
  const strengths = [];
  const improvementAreas = [];

  if (postureScore >= 8) strengths.push("Excellente posture et positionnement");
  else if (postureScore <= 5) improvementAreas.push("Améliorer le positionnement face caméra");

  if (stabilityScore >= 8) strengths.push("Très bonne stabilité et présence");
  else if (stabilityScore <= 5) improvementAreas.push("Réduire les mouvements parasites");

  if (voiceQualityScore >= 8) strengths.push("Excellente qualité vocale");
  else if (voiceQualityScore <= 5) improvementAreas.push("Améliorer la projection vocale");

  if (hasMediaPipeData) {
    strengths.push(`Détection faciale IA active (${mediaPipeCount}/${videoAnalysisData.length} mesures)`);
  }

  if (improvementTrend === 'improving') {
    strengths.push("Amélioration progressive durant l'entretien");
  } else if (improvementTrend === 'declining') {
    improvementAreas.push("Maintenir la qualité tout au long de l'entretien");
  }

  // Generate media literacy tips
  const mediaLiteracyTips = [
    "Placez la caméra au niveau des yeux pour un contact visuel optimal",
    "Assurez-vous d'avoir un éclairage uniforme sur le visage",
    "Testez votre setup technique avant l'entretien",
    "Maintenez une distance appropriée de la caméra (60-80cm)",
    "Évitez les arrière-plans distrayants"
  ];

  if (hasMediaPipeData) {
    mediaLiteracyTips.push("Votre configuration permet la détection faciale IA - excellente qualité technique");
  }

  const result: ProcessedVideoAnalysis = {
    postureScore,
    stabilityScore,
    voiceQualityScore,
    presenceScore,
    professionalismScore,
    overallBehavioralScore,
    breakdown: {
      posture: {
        score: postureScore,
        feedback: generateFeedback(postureScore, "Posture"),
        metrics: {
          faceCentered: videoAnalysisData.filter(d => d.posture?.faceCentered).length > videoAnalysisData.length / 2,
          faceVisible: videoAnalysisData.filter(d => d.posture?.faceVisible).length > videoAnalysisData.length * 0.8,
          appropriateDistance: videoAnalysisData.filter(d => d.posture?.appropriateDistance).length > videoAnalysisData.length / 2,
          avgFaceSize: hasMediaPipeData ? 
            videoAnalysisData.reduce((sum, d) => sum + (d.posture?.faceSize || 0), 0) / videoAnalysisData.length : null
        }
      },
      stability: {
        score: stabilityScore,
        feedback: generateFeedback(stabilityScore, "Stabilité"),
        metrics: {
          avgMovement: videoAnalysisData.reduce((sum, d) => sum + (d.movement?.fidgetingLevel || 0), 0) / videoAnalysisData.length,
          avgHeadMovement: hasMediaPipeData ?
            videoAnalysisData.reduce((sum, d) => sum + (d.movement?.headMovement || 0), 0) / videoAnalysisData.length : null
        }
      },
      voiceQuality: {
        score: voiceQualityScore,
        feedback: generateFeedback(voiceQualityScore, "Qualité vocale"),
        metrics: {
          avgVolume: videoAnalysisData.reduce((sum, d) => sum + (d.audioQuality?.volumeLevel || 0), 0) / videoAnalysisData.length,
          avgClarity: videoAnalysisData.reduce((sum, d) => sum + (d.audioQuality?.clarity || 0), 0) / videoAnalysisData.length
        }
      },
      presence: {
        score: presenceScore,
        feedback: generateFeedback(presenceScore, "Présence"),
        metrics: {
          engagement: presenceScore,
          mediaLiteracyLevel: hasMediaPipeData ? 9 : 6,
          aiEnhanced: hasMediaPipeData
        }
      }
    },
    analytics: {
      totalMeasures: videoAnalysisData.length,
      analysisTimeMinutes,
      consistencyScore: Math.round(10 - (Math.abs(postureScore - stabilityScore) + Math.abs(stabilityScore - voiceQualityScore)) / 2),
      improvementTrend,
      strengths,
      improvementAreas,
      mediaLiteracyTips
    }
  };

  // Add MediaPipe-specific data if available
  if (hasMediaPipeData) {
    const mediaPipeItems = videoAnalysisData.filter(d => d.faceDetection?.realMediaPipe === true);
    result.faceAnalysis = {
      avgDetectionConfidence: mediaPipeItems.reduce((sum, d) => 
        sum + (d.faceDetection?.confidence || 0), 0) / mediaPipeItems.length,
      mediaLiteracyLevel: 9
    };
  }

  return result;
}

// Component interface
interface VideoAnalysisResultsProps {
  videoAnalysisData: VideoAnalysisData[];
  className?: string;
}

// Main component
const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  videoAnalysisData,
  className = ''
}) => {
  // Handle no data case
  if (!videoAnalysisData || videoAnalysisData.length === 0) {
    return (
      <div className={`video-analysis-results ${className}`}>
        <div className="alert">
          <div className="alert-icon">📹</div>
          <div>Données vidéo non disponibles pour cette question</div>
        </div>
      </div>
    );
  }

  console.log('📊 VideoAnalysisResults received data:', videoAnalysisData.length, 'items');

  // Process the data with backward compatibility
  const results = processVideoAnalysisDataCompatible(videoAnalysisData);
  const isCompact = className.includes('compact');

  // Check if we have MediaPipe data
  const hasMediaPipeData = videoAnalysisData.some(d => d.faceDetection?.realMediaPipe === true);
  const mediaPipeCount = videoAnalysisData.filter(d => d.faceDetection?.realMediaPipe === true).length;
  const mediaPipePercentage = Math.round((mediaPipeCount / videoAnalysisData.length) * 100);

  // Compact view for individual questions
  if (isCompact) {
    return (
      <div className={`video-analysis-results ${className}`}>
        <div className="scores-grid">
          <div className="score-item">
            <div className="score-label">Posture</div>
            <div className="score-number">{results.postureScore}/10</div>
            {results.breakdown.posture.metrics.faceCentered && (
              <div className="score-badge">✓ Centrée</div>
            )}
          </div>
          <div className="score-item">
            <div className="score-label">Stabilité</div>
            <div className="score-number">{results.stabilityScore}/10</div>
          </div>
          <div className="score-item">
            <div className="score-label">Voix</div>
            <div className="score-number">{results.voiceQualityScore}/10</div>
          </div>
          <div className="score-item">
            <div className="score-label">Présence</div>
            <div className="score-number">{results.presenceScore}/10</div>
          </div>
        </div>
        
        <div className="item-content" style={{ textAlign: 'center', marginTop: '1rem' }}>
          <strong>Score Comportemental: {results.overallBehavioralScore}/10</strong>
          <br />
          <small>
            {results.analytics.totalMeasures} mesures • {results.analytics.analysisTimeMinutes} min
            {hasMediaPipeData && <> • 🤖 {mediaPipeCount} IA ({mediaPipePercentage}%)</>}
          </small>
        </div>
      </div>
    );
  }

  // Full view for overall analysis
  return (
    <div className={`video-analysis-results ${className}`}>
      {/* MediaPipe status indicator */}
      {hasMediaPipeData && (
        <div style={{
          background: '#dcfce7',
          border: '2px solid #16a34a',
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            🤖 Analyse Renforcée par IA MediaPipe
          </div>
          <div style={{ fontSize: '0.9rem', color: '#166534' }}>
            {mediaPipeCount} mesures sur {videoAnalysisData.length} avec détection faciale IA 
            ({mediaPipePercentage}% • Confiance moyenne: {Math.round((results.faceAnalysis?.avgDetectionConfidence || 0) * 100)}%)
          </div>
        </div>
      )}

      {/* Main scores */}
      <div className="scores-grid">
        <div className="score-item">
          <div className="score-label">Posture</div>
          <div className="score-number">{results.postureScore}/10</div>
          {results.breakdown.posture.metrics.faceCentered && (
            <div className="score-badge">✓ Centrée</div>
          )}
          {hasMediaPipeData && (
            <div className="score-badge ai-badge">🤖 IA</div>
          )}
        </div>
        <div className="score-item">
          <div className="score-label">Stabilité</div>
          <div className="score-number">{results.stabilityScore}/10</div>
          {hasMediaPipeData && results.breakdown.stability.metrics.avgHeadMovement !== null && (
            <div className="score-badge ai-badge">🤖 IA</div>
          )}
        </div>
        <div className="score-item">
          <div className="score-label">Qualité Vocale</div>
          <div className="score-number">{results.voiceQualityScore}/10</div>
        </div>
        <div className="score-item">
          <div className="score-label">Présence</div>
          <div className="score-number">{results.presenceScore}/10</div>
          {hasMediaPipeData && (
            <div className="score-badge ai-badge">🤖 IA</div>
          )}
        </div>
        <div className="score-item">
          <div className="score-label">Professionnalisme</div>
          <div className="score-number">{results.professionalismScore}/10</div>
        </div>
      </div>

      {/* Overall score */}
      <div className="overall-score">
        <div className="score-display">
          <span className="score-value">{results.overallBehavioralScore}</span>
          <span className="score-total">/10</span>
          {hasMediaPipeData && (
            <span className="ai-enhanced">🤖</span>
          )}
        </div>
        <div className="score-description">
          Score Comportemental
          {hasMediaPipeData && ' • Analyse IA renforcée'}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Tendance: {
            results.analytics.improvementTrend === 'improving' ? '📈 En amélioration' :
            results.analytics.improvementTrend === 'declining' ? '📉 En baisse' :
            '➡️ Stable'
          }
        </div>
      </div>

      {/* Detailed feedback */}
      <div className="feedback">
        <div className="feedback-item">
          <div className="feedback-label">Posture ({results.breakdown.posture.score}/10)</div>
          <div className="feedback-content">
            {results.breakdown.posture.feedback}
            {hasMediaPipeData && results.breakdown.posture.metrics.avgFaceSize && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                🤖 Analyse IA: Taille visage moyenne {Math.round(results.breakdown.posture.metrics.avgFaceSize * 100)}%
              </div>
            )}
          </div>
        </div>

        <div className="feedback-item">
          <div className="feedback-label">Stabilité ({results.breakdown.stability.score}/10)</div>
          <div className="feedback-content">
            {results.breakdown.stability.feedback}
            {hasMediaPipeData && results.breakdown.stability.metrics.avgHeadMovement !== null && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                🤖 Analyse IA: Mouvement tête {Math.round(results.breakdown.stability.metrics.avgHeadMovement * 1000)/10}%
              </div>
            )}
          </div>
        </div>

        <div className="feedback-item">
          <div className="feedback-label">Qualité Vocale ({results.breakdown.voiceQuality.score}/10)</div>
          <div className="feedback-content">
            {results.breakdown.voiceQuality.feedback}
          </div>
        </div>

        <div className="feedback-item">
          <div className="feedback-label">Présence ({results.breakdown.presence.score}/10)</div>
          <div className="feedback-content">
            {results.breakdown.presence.feedback}
            {hasMediaPipeData && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                🤖 Niveau technologique: {results.breakdown.presence.metrics.mediaLiteracyLevel}/10
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics summary */}
      <div className="item-content" style={{ textAlign: 'center', marginTop: '2rem' }}>
        📊 {results.analytics.totalMeasures} mesures • 
        ⏱️ {results.analytics.analysisTimeMinutes} min d'analyse • 
        🎯 Cohérence: {results.analytics.consistencyScore}/10
        {hasMediaPipeData && <> • 🤖 IA MediaPipe: {mediaPipePercentage}%</>}
      </div>

      {/* Strengths and improvements */}
      {(results.analytics.strengths.length > 0 || results.analytics.improvementAreas.length > 0) && (
        <>
          {results.analytics.strengths.length > 0 && (
            <div className="feedback-item" style={{ marginTop: '2rem' }}>
              <div className="feedback-label">✅ Points Forts</div>
              <div className="feedback-content">
                {results.analytics.strengths.map((strength, index) => (
                  <div key={index} style={{ marginBottom: '0.5rem' }}>• {strength}</div>
                ))}
              </div>
            </div>
          )}

          {results.analytics.improvementAreas.length > 0 && (
            <div className="feedback-item" style={{ marginTop: '1rem' }}>
              <div className="feedback-label">💡 Axes d'Amélioration</div>
              <div className="feedback-content">
                {results.analytics.improvementAreas.map((improvement, index) => (
                  <div key={index} style={{ marginBottom: '0.5rem' }}>• {improvement}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Media literacy tips */}
      {results.analytics.mediaLiteracyTips.length > 0 && (
        <div className="feedback-item" style={{ marginTop: '1rem' }}>
          <div className="feedback-label">📱 Conseils Techniques</div>
          <div className="feedback-content">
            {results.analytics.mediaLiteracyTips.slice(0, 3).map((tip, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>• {tip}</div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .video-analysis-results {
          width: 100%;
        }

        .alert {
          background: #fef2f2;
          border: 2px solid #ef4444;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-align: left;
        }

        .alert-icon {
          font-size: 1.2rem;
        }

        .scores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .score-item {
          background: var(--white);
          border: 2px solid var(--gray-300);
          padding: 1rem;
          text-align: center;
          transition: transform 0.2s ease;
          border-radius: 8px;
        }

        .score-item:hover {
          transform: translateY(-2px);
          box-shadow: 4px 4px 0 var(--black);
        }

        .score-label {
          font-size: 0.8rem;
          color: var(--gray-600);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .score-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 0.25rem;
        }

        .score-badge {
          font-size: 0.7rem;
          background: #dcfce7;
          color: #166534;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          margin: 0.25rem 0.25rem 0 0;
        }

        .ai-badge {
          background: #fef3c7;
          color: #92400e;
        }

        .overall-score {
          text-align: center;
          margin: 2rem 0;
          padding: 2rem;
          background: var(--gray-50);
          border: 2px solid var(--gray-300);
          border-radius: 8px;
        }

        .score-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .score-value {
          font-size: 3rem;
          font-weight: 700;
          color: var(--black);
        }

        .score-total {
          font-size: 2rem;
          color: var(--gray-600);
        }

        .ai-enhanced {
          background: var(--yellow);
          color: var(--black);
          padding: 0.5rem;
          border: 2px solid var(--black);
          font-size: 1rem;
          font-weight: 600;
          border-radius: 4px;
        }

        .score-description {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--gray-700);
        }

        .feedback {
          margin-top: 2rem;
        }

        .feedback-item {
          margin-bottom: 1.5rem;
        }

        .feedback-item:last-child {
          margin-bottom: 0;
        }

        .feedback-label {
          font-weight: 600;
          color: var(--black);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .feedback-content {
          color: var(--gray-700);
          line-height: 1.6;
          padding: 1rem;
          background: var(--gray-50);
          border-left: 4px solid var(--yellow);
          border-radius: 0 4px 4px 0;
        }

        .item-content {
          color: var(--gray-700);
          line-height: 1.6;
          padding: 1rem;
          background: var(--gray-50);
          border-left: 4px solid var(--yellow);
          border-radius: 0 4px 4px 0;
        }

        @media (max-width: 768px) {
          .scores-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }

          .score-number {
            font-size: 1.2rem;
          }

          .score-value {
            font-size: 2.5rem;
          }

          .overall-score {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoAnalysisResults;