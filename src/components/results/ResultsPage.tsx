// src/components/results/ResultsPage.tsx
import React from 'react';
import VideoAnalysisResults from './VideoAnalysisResults';
import { Evaluation } from '../../types';

interface ResultsPageProps {
  evaluationResults: Evaluation[];
  onReset: () => void;
  onSaveResults: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
}

const ResultsPage: React.FC<ResultsPageProps> = ({
  evaluationResults,
  onReset,
  onSaveResults,
  onExportPDF,
  isExporting
}) => {
  // Calculate overall interview score using EvaluationData structure
  const calculateOverallScore = () => {
    if (evaluationResults.length === 0) return 0;
    
    const totalScore = evaluationResults.reduce((sum, result) => {
      return sum + (result.evaluation.overall_score || 0);
    }, 0);
    
    return Math.round(totalScore / evaluationResults.length);
  };

  // Aggregate all video analysis data
  const getAllVideoAnalysisData = () => {
    return evaluationResults.flatMap(result => result.videoAnalysis || []);
  };

  const overallScore = calculateOverallScore();
  const allVideoData = getAllVideoAnalysisData();

  return (
    <div className="app">
      <div className="container">
        {/* Header using existing styles */}
        <div className="results-header">
          <h1 className="results-title">📊 Résultats de l'Entretien</h1>
          <p className="results-subtitle">Voici le détail de votre performance</p>
        </div>

        {/* Overall Score using existing styles */}
        <div className="overall-score">
          <div className="score-display">
            <span className="score-value">{overallScore}</span>
            <span className="score-total">/10</span>
          </div>
          <div className="score-description">Score Global d'Entretien</div>
        </div>

        {/* Individual Question Results */}
        <div className="results">
          {evaluationResults.map((result, index) => (
            <div key={index} className="result-card">
              <div className="result-header">
                <div className="result-info">
                  <span className="result-number">{index + 1}</span>
                  <h3>Question {index + 1}</h3>
                </div>
                <div className="result-score">
                  {result.evaluation.overall_score}/10
                </div>
              </div>
              
              <div className="result-content">
                {/* Question */}
                <div className="result-item">
                  <div className="item-label">Question</div>
                  <div className="item-content">
                    {result.question}
                  </div>
                </div>

                {/* Answer */}
                <div className="result-item">
                  <div className="item-label">Votre réponse</div>
                  <div className="item-content item-answer">
                    {result.answer.length > 200
                      ? result.answer.substring(0, 200) + '...'
                      : result.answer}
                  </div>
                </div>

                {/* Detailed Scores using existing grid */}
                {Object.keys(result.evaluation.scores || {}).length > 0 && (
                  <div className="result-item">
                    <div className="item-label">Scores détaillés</div>
                    <div className="scores-grid">
                      {Object.entries(result.evaluation.scores || {}).map(([key, value]) => (
                        <div key={key} className="score-item">
                          <div className="score-label">{key}</div>
                          <div className="score-number">{value}/10</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback using existing styles */}
                <div className="feedback">
                  <div className="feedback-item">
                    <div className="feedback-label">Feedback</div>
                    <div className="feedback-content">
                      {result.evaluation.feedback}
                    </div>
                  </div>

                  {result.evaluation.suggestions && (
                    <div className="feedback-item">
                      <div className="feedback-label">Suggestions</div>
                      <div className="feedback-content">
                        {result.evaluation.suggestions}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Analysis for this question */}
                {result.videoAnalysis && result.videoAnalysis.length > 0 && (
                  <div className="result-item">
                    <div className="item-label">📹 Analyse Comportementale</div>
                    <VideoAnalysisResults 
                      videoAnalysisData={result.videoAnalysis}
                      className="video-analysis-compact"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Overall Video Analysis Summary */}
        {allVideoData.length > 0 && (
          <div className="section" style={{ marginBottom: '2rem' }}>
            <div className="section-header">
              <h2 className="section-title">🎥 Analyse Comportementale Globale</h2>
              <p className="section-description">Synthèse de votre présentation durant tout l'entretien</p>
            </div>
            <div className="input-container">
              <VideoAnalysisResults 
                videoAnalysisData={allVideoData}
                className="video-analysis-full"
              />
            </div>
          </div>
        )}

        {/* Action Buttons using existing styles */}
        <div className="export-actions">
          <button 
            onClick={onSaveResults}
            className="btn btn-secondary"
          >
            💾 Sauvegarder
          </button>
          
          <button 
            onClick={onExportPDF}
            disabled={isExporting}
            className="btn btn-primary"
          >
            {isExporting ? (
              <>
                <div className="spinner"></div>
                Export en cours...
              </>
            ) : (
              '📄 Exporter PDF'
            )}
          </button>
          
          <button 
            onClick={onReset}
            className="btn btn-outline"
          >
            🔄 Nouvel Entretien
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;