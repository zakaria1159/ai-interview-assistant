// src/components/results/VideoAnalysisResults.tsx
import React from 'react';
import { processVideoAnalysisData, VideoAnalysisData } from '../../utils/videoAnalysisProcessor';

interface VideoAnalysisResultsProps {
  videoAnalysisData: VideoAnalysisData[];
  className?: string;
}

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

  // Process the data
  const results = processVideoAnalysisData(videoAnalysisData);
  const isCompact = className.includes('compact');

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
          <small>{results.analytics.totalMeasures} mesures • {results.analytics.analysisTimeMinutes} min</small>
        </div>
      </div>
    );
  }

  // Full view for overall analysis
  return (
    <div className={`video-analysis-results ${className}`}>
      {/* Main scores using existing grid */}
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

      {/* Overall score using existing style */}
      <div className="overall-score">
        <div className="score-display">
          <span className="score-value">{results.overallBehavioralScore}</span>
          <span className="score-total">/10</span>
        </div>
        <div className="score-description">Score Comportemental</div>
      </div>

      {/* Analysis details using existing feedback structure */}
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
      </div>

      <div className="feedback">
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
        ⏱️ {results.analytics.analysisTimeMinutes} min d'analyse • 
        🎯 Consistance: {results.analytics.consistencyScore}/10
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
    </div>
  );
};

export default VideoAnalysisResults;