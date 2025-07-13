// src/components/results/ResultsPage.tsx
// Final updated version with fixed VideoAnalysisResults component

import React from 'react';
import { Evaluation } from '../../types';
import VideoAnalysisResults from './VideoAnalysisResults'; // Using the updated component

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

  // Analyze MediaPipe data across all results
  const analyzeMediaPipeData = () => {
    console.log('🔍 RESULTS PAGE ANALYSIS - Full evaluation results:', evaluationResults);
    
    let totalRealMediaPipe = 0;
    let totalVideoItems = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;
    const questionAnalysis: Array<{
      questionNumber: number;
      videoItems: number;
      mediaPipeItems: number;
      avgConfidence: number;
      hasRealMediaPipe: boolean;
    }> = [];
    
    evaluationResults.forEach((result, index) => {
      const videoAnalysis = result.videoAnalysis || [];
      totalVideoItems += videoAnalysis.length;
      
      const realMediaPipeItems = videoAnalysis.filter(item => 
        item.faceDetection?.realMediaPipe === true
      );
      totalRealMediaPipe += realMediaPipeItems.length;
      
      // Calculate average confidence for this question
      const confidences = realMediaPipeItems
        .map(item => item.faceDetection?.confidence || 0)
        .filter(conf => conf > 0);
      
      const avgConfidence = confidences.length > 0 ? 
        confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length : 0;
      
      if (confidences.length > 0) {
        totalConfidence += avgConfidence;
        confidenceCount++;
      }
      
      questionAnalysis.push({
        questionNumber: index + 1,
        videoItems: videoAnalysis.length,
        mediaPipeItems: realMediaPipeItems.length,
        avgConfidence,
        hasRealMediaPipe: realMediaPipeItems.length > 0
      });
      
      console.log(`📊 Question ${index + 1}:`, {
        question: result.question.substring(0, 50) + '...',
        hasVideoAnalysis: !!result.videoAnalysis,
        videoAnalysisLength: videoAnalysis.length,
        realMediaPipeItems: realMediaPipeItems.length,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        firstVideoItem: videoAnalysis[0] ? {
          hasRealMediaPipe: videoAnalysis[0].faceDetection?.realMediaPipe || false,
          confidence: videoAnalysis[0].faceDetection?.confidence || 0
        } : null
      });
    });
    
    const overallAvgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const mediaPipeSuccessRate = totalVideoItems > 0 ? (totalRealMediaPipe / totalVideoItems) * 100 : 0;
    
    console.log(`📈 OVERALL ANALYSIS:`, {
      totalQuestions: evaluationResults.length,
      totalVideoItems,
      totalRealMediaPipe,
      mediaPipeSuccessRate: Math.round(mediaPipeSuccessRate),
      overallAvgConfidence: Math.round(overallAvgConfidence * 100) / 100,
      questionsWithMediaPipe: questionAnalysis.filter(q => q.hasRealMediaPipe).length
    });
    
    return { 
      totalRealMediaPipe, 
      totalVideoItems, 
      overallAvgConfidence,
      mediaPipeSuccessRate,
      questionAnalysis
    };
  };

  const { 
    totalRealMediaPipe, 
    totalVideoItems, 
    overallAvgConfidence,
    mediaPipeSuccessRate,
    questionAnalysis
  } = analyzeMediaPipeData();

  // Aggregate all video analysis data
  const getAllVideoAnalysisData = () => {
    return evaluationResults.flatMap(result => result.videoAnalysis || []);
  };

  const overallScore = calculateOverallScore();
  const allVideoData = getAllVideoAnalysisData();
  const questionsWithMediaPipe = questionAnalysis.filter(q => q.hasRealMediaPipe).length;

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <div className="results-header">
          <h1 className="results-title">📊 Résultats de l'Entretien</h1>
          <p className="results-subtitle">Voici le détail de votre performance</p>
        </div>

        {/* Overall Score */}
        <div className="overall-score">
          <div className="score-display">
            <span className="score-value">{overallScore}</span>
            <span className="score-total">/10</span>
          </div>
          <div className="score-description">Score Global d'Entretien</div>
        </div>

        {/* MediaPipe Data Status - Enhanced */}
        <div style={{ 
          background: totalRealMediaPipe > 0 ? '#dcfce7' : totalVideoItems > 0 ? '#fef3c7' : '#fee2e2', 
          border: `2px solid ${totalRealMediaPipe > 0 ? '#16a34a' : totalVideoItems > 0 ? '#f59e0b' : '#ef4444'}`, 
          padding: '1.5rem', 
          margin: '2rem 0',
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
              🤖 Statut de l'Analyse IA MediaPipe
            </h4>
            {totalRealMediaPipe > 0 && (
              <div style={{
                background: '#16a34a',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                ✅ IA ACTIVE
              </div>
            )}
          </div>
          
          <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
            {totalRealMediaPipe > 0 ? (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  🎯 <strong>{totalRealMediaPipe}</strong> analyses avec détection faciale IA sur <strong>{totalVideoItems}</strong> total
                  <br />
                  📈 Taux de réussite MediaPipe: <strong>{Math.round(mediaPipeSuccessRate)}%</strong>
                  <br />
                  🎭 Confiance moyenne de détection: <strong>{Math.round(overallAvgConfidence * 100)}%</strong>
                  <br />
                  📋 Questions avec IA: <strong>{questionsWithMediaPipe}</strong>/{evaluationResults.length}
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  padding: '0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}>
                  ✨ <strong>Analyse premium:</strong> Votre entretien a bénéficié de la technologie de détection faciale IA pour une analyse comportementale précise et objective.
                </div>
              </>
            ) : totalVideoItems > 0 ? (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  ⚠️ <strong>{totalVideoItems}</strong> analyses de base effectuées (MediaPipe non disponible)
                  <br />
                  📊 L'analyse comportementale fonctionne mais sans détection faciale IA
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  padding: '0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}>
                  💡 <strong>Note:</strong> Pour une analyse optimale, assurez-vous d'utiliser un navigateur moderne (Chrome/Firefox) avec une connexion internet stable.
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  ❌ Aucune donnée d'analyse vidéo disponible
                  <br />
                  🔧 L'analyse comportementale n'était pas active durant l'entretien
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  padding: '0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}>
                  💡 <strong>Conseil:</strong> Activez l'analyse comportementale lors du prochain entretien pour un feedback plus complet.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Individual Question Results */}
        <div className="results">
          {evaluationResults.map((result, index) => {
            const questionData = questionAnalysis[index];
            const hasRealMediaPipe = questionData?.hasRealMediaPipe || false;
            const avgConfidence = questionData?.avgConfidence || 0;

            return (
              <div key={index} className="result-card">
                <div className="result-header">
                  <div className="result-info">
                    <span className="result-number">{index + 1}</span>
                    <h3>Question {index + 1}</h3>
                    
                    {/* Status badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                      {hasRealMediaPipe && (
                        <span style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          🤖 IA ({Math.round(avgConfidence * 100)}%)
                        </span>
                      )}
                      
                      {questionData?.videoItems > 0 && (
                        <span style={{
                          background: '#e0e7ff',
                          color: '#3730a3',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          📹 {questionData.videoItems} mesures
                        </span>
                      )}
                    </div>
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

                  {/* Detailed Scores */}
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

                  {/* Feedback */}
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
                      <div className="item-label">
                        📹 Analyse Comportementale
                        {hasRealMediaPipe && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            marginLeft: '0.5rem'
                          }}>
                            🤖 Enrichie par IA MediaPipe
                          </span>
                        )}
                      </div>
                      <VideoAnalysisResults 
                        videoAnalysisData={result.videoAnalysis}
                        className="video-analysis-compact"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Video Analysis Summary */}
        {allVideoData.length > 0 && (
          <div className="section" style={{ marginBottom: '2rem' }}>
            <div className="section-header">
              <h2 className="section-title">
                🎥 Analyse Comportementale Globale
                {totalRealMediaPipe > 0 && (
                  <span style={{
                    background: '#dcfce7',
                    color: '#166534',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    marginLeft: '1rem'
                  }}>
                    🤖 Enrichie par IA MediaPipe ({Math.round(mediaPipeSuccessRate)}%)
                  </span>
                )}
              </h2>
              <p className="section-description">
                Synthèse de votre présentation durant tout l'entretien 
                ({allVideoData.length} mesures{totalRealMediaPipe > 0 ? `, dont ${totalRealMediaPipe} avec IA` : ''})
                {totalRealMediaPipe > 0 && (
                  <>
                    <br />
                    <small style={{ color: '#166534' }}>
                      ✨ Confiance moyenne de détection faciale: {Math.round(overallAvgConfidence * 100)}%
                    </small>
                  </>
                )}
              </p>
            </div>
            <div className="input-container">
              <VideoAnalysisResults 
                videoAnalysisData={allVideoData}
                className="video-analysis-full"
              />
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {totalVideoItems > 0 && (
          <div style={{
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            padding: '1.5rem',
            margin: '2rem 0',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
              📊 Résumé de Performance
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{evaluationResults.length}</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Questions Évaluées</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{totalVideoItems}</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Mesures Comportementales</div>
              </div>
              
              {totalRealMediaPipe > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>{Math.round(mediaPipeSuccessRate)}%</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Analyses IA MediaPipe</div>
                </div>
              )}
              
              {totalRealMediaPipe > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>{Math.round(overallAvgConfidence * 100)}%</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Confiance Détection</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Details (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <details style={{ 
            margin: '2rem 0', 
            padding: '1rem', 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6',
            borderRadius: '8px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              🔧 Détails Techniques (Dev Mode)
            </summary>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              <div><strong>Total Questions:</strong> {evaluationResults.length}</div>
              <div><strong>Total Mesures Vidéo:</strong> {totalVideoItems}</div>
              <div><strong>Mesures MediaPipe:</strong> {totalRealMediaPipe}</div>
              <div><strong>Taux MediaPipe:</strong> {Math.round(mediaPipeSuccessRate)}%</div>
              <div><strong>Confiance Moyenne:</strong> {Math.round(overallAvgConfidence * 100)}%</div>
              <div><strong>Questions avec IA:</strong> {questionsWithMediaPipe}/{evaluationResults.length}</div>
              
              <div style={{ marginTop: '1rem' }}>
                <strong>Détail par Question:</strong>
                {questionAnalysis.map((q, index) => (
                  <div key={index} style={{ marginLeft: '1rem', padding: '0.25rem 0' }}>
                    <strong>Q{q.questionNumber}:</strong> {q.videoItems} mesures
                    {q.hasRealMediaPipe && 
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        {' '}✅ MediaPipe ({Math.round(q.avgConfidence * 100)}%)
                      </span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}

        {/* Action Buttons */}
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