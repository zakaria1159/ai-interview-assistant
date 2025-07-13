// The issue: We changed the VideoAnalysisData interface when adding MediaPipe
// but the results page still expects the old format

// OLD FORMAT (before MediaPipe):
interface OldVideoAnalysisData {
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

// NEW FORMAT (with MediaPipe):
interface NewVideoAnalysisData {
  posture: {
    score: number;
    faceCentered: boolean;
    faceVisible: boolean;
    appropriateDistance: boolean;
    faceSize: number;              // NEW
    horizontalAlignment: number;   // NEW
    verticalAlignment: number;     // NEW
  };
  movement: {
    score: number;
    fidgetingLevel: number;
    stability: number;
    headMovement: number;          // NEW
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
  faceDetection: {                 // NEW SECTION
    detectionCount: number;
    confidence: number;
    landmarks: any[];
  };
}

// SOLUTION: Create a backward-compatible processor
export function processVideoAnalysisDataCompatible(videoAnalysisData: any[]) {
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

  // Calculate presence score
  const presenceScore = Math.round(
    videoAnalysisData.reduce((sum, d) => {
      let score = 0;
      if (d.posture?.faceVisible) score += 3;
      if (d.posture?.faceCentered) score += 3;
      if (d.posture?.appropriateDistance) score += 2;
      // MediaPipe bonus if available
      if (d.faceDetection?.confidence > 0.7) score += 2;
      return sum + Math.min(10, score);
    }, 0) / videoAnalysisData.length
  );

  const professionalismScore = Math.round((postureScore + stabilityScore + presenceScore) / 3);
  const overallBehavioralScore = Math.round((postureScore + stabilityScore + voiceQualityScore + presenceScore) / 4);

  // Generate feedback
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
  const hasMediaPipeData = videoAnalysisData.some(d => d.faceDetection?.confidence > 0);

  const strengths = [];
  const improvementAreas = [];

  if (postureScore >= 8) strengths.push("Excellente posture et positionnement");
  else if (postureScore <= 5) improvementAreas.push("Améliorer le positionnement face caméra");

  if (stabilityScore >= 8) strengths.push("Très bonne stabilité et présence");
  else if (stabilityScore <= 5) improvementAreas.push("Réduire les mouvements parasites");

  if (voiceQualityScore >= 8) strengths.push("Excellente qualité vocale");
  else if (voiceQualityScore <= 5) improvementAreas.push("Améliorer la projection vocale");

  if (hasMediaPipeData) strengths.push("Détection faciale IA active pour une analyse précise");

  return {
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
          appropriateDistance: videoAnalysisData.filter(d => d.posture?.appropriateDistance).length > videoAnalysisData.length / 2
        }
      },
      stability: {
        score: stabilityScore,
        feedback: generateFeedback(stabilityScore, "Stabilité"),
        metrics: {
          avgMovement: videoAnalysisData.reduce((sum, d) => sum + (d.movement?.fidgetingLevel || 0), 0) / videoAnalysisData.length
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
          mediaLiteracy: hasMediaPipeData ? 10 : 5
        }
      }
    },
    analytics: {
      totalMeasures: videoAnalysisData.length,
      analysisTimeMinutes,
      consistencyScore: 8, // Simplified for compatibility
      improvementTrend: 'stable' as const,
      strengths,
      improvementAreas,
      mediaLiteracyTips: [
        "Placez la caméra au niveau des yeux",
        "Assurez-vous d'avoir un bon éclairage",
        "Testez votre setup avant l'entretien"
      ]
    },
    // Add MediaPipe-specific data if available
    ...(hasMediaPipeData && {
      faceAnalysis: {
        avgDetectionConfidence: videoAnalysisData.reduce((sum, d) => 
          sum + (d.faceDetection?.confidence || 0), 0) / videoAnalysisData.length,
        mediaLiteracyLevel: 9
      }
    })
  };
}

// Fixed VideoAnalysisResults component that works with both formats
import React from 'react';

interface VideoAnalysisResultsProps {
  videoAnalysisData: any[]; // Accept any format
  className?: string;
}

const VideoAnalysisResultsFixed: React.FC<VideoAnalysisResultsProps> = ({
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
  const hasMediaPipeData = videoAnalysisData.some(d => d.faceDetection?.confidence > 0);

  // Compact view for individual questions
  if (isCompact) {
    return (
      <div className={`video-analysis-results ${className}`}>
        <div className="scores-grid">
          <div className="score-item">
            <div className="score-label">Posture</div>
            <div className="score-number">{results.postureScore}/10</div>
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
            {hasMediaPipeData && <> • 🤖 IA MediaPipe</>}
          </small>
        </div>
      </div>
    );
  }

  // Full view for overall analysis
  return (
    <div className={`video-analysis-results ${className}`}>
      {/* Main scores */}
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
          <div className="score-label">Qualité Vocale</div>
          <div className="score-number">{results.voiceQualityScore}/10</div>
        </div>
        <div className="score-item">
          <div className="score-label">Présence</div>
          <div className="score-number">{results.presenceScore}/10</div>
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
      </div>

      {/* Feedback */}
      <div className="feedback">
        <div className="feedback-item">
          <div className="feedback-label">Posture ({results.breakdown.posture.score}/10)</div>
          <div className="feedback-content">
            {results.breakdown.posture.feedback}
          </div>
        </div>

        <div className="feedback-item">
          <div className="feedback-label">Stabilité ({results.breakdown.stability.score}/10)</div>
          <div className="feedback-content">
            {results.breakdown.stability.feedback}
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
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="item-content" style={{ textAlign: 'center', marginTop: '1rem' }}>
        📊 {results.analytics.totalMeasures} mesures • 
        ⏱️ {results.analytics.analysisTimeMinutes} min d'analyse
        {hasMediaPipeData && <> • 🤖 Analyse IA MediaPipe active</>}
      </div>

      {/* Recommendations */}
      {(results.analytics.strengths.length > 0 || results.analytics.improvementAreas.length > 0) && (
        <>
          {results.analytics.strengths.length > 0 && (
            <div className="feedback-item" style={{ marginTop: '1rem' }}>
              <div className="feedback-label">✅ Points Forts</div>
              <div className="feedback-content">
                {results.analytics.strengths.map((strength, index) => (
                  <div key={index}>• {strength}</div>
                ))}
              </div>
            </div>
          )}

          {results.analytics.improvementAreas.length > 0 && (
            <div className="feedback-item" style={{ marginTop: '1rem' }}>
              <div className="feedback-label">💡 Axes d'Amélioration</div>
              <div className="feedback-content">
                {results.analytics.improvementAreas.map((improvement, index) => (
                  <div key={index}>• {improvement}</div>
                ))}
              </div>
            </div>
          )}
        </>
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
          margin-top: 0.25rem;
        }

        .overall-score {
          text-align: center;
          margin: 2rem 0;
          padding: 2rem;
          background: var(--gray-50);
          border: 2px solid var(--gray-300);
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
        }

        .item-content {
          color: var(--gray-700);
          line-height: 1.6;
          padding: 1rem;
          background: var(--gray-50);
          border-left: 4px solid var(--yellow);
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

export default VideoAnalysisResultsFixed;