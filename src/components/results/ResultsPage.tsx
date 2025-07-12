'use client';
import React from 'react';
import Button from '../common/Button';

interface ScoreDetails {
  [key: string]: number;
}

interface Evaluation {
  question: string;
  answer: string;
  evaluation: {
    scores: ScoreDetails;
    overall_score: number;
    feedback: string;
    suggestions: string;
  };
}

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
  isExporting,
}) => {
  const overallScore =
    evaluationResults.length > 0
      ? evaluationResults.reduce((sum, e) => sum + e.evaluation.overall_score, 0) /
      evaluationResults.length
      : 0;

  const scoreMessage =
    overallScore >= 8
      ? '🎉 Excellent performance!'
      : overallScore >= 6
        ? '👍 Bonne performance'
        : overallScore >= 4
          ? '📈 Performance moyenne'
          : '💪 Points d\'amélioration identifiés';

  return (
    <div className="container">
      <div className="results-header">
        <h1 className="results-title">📊 Résultats de l'entretien</h1>
        <p className="results-subtitle">{scoreMessage}</p>
      </div>

      <div className="overall-score">
        <div className="score-display">
          <div className="score-value">
            {isNaN(overallScore) ? '0' : (Math.round(overallScore * 10) / 10).toString()}
          </div>
          <div className="score-total">/10</div>
        </div>
        <div className="score-description">Score global</div>
      </div>

      <div className="results">
        {evaluationResults.map((evalItem, index) => (
          <div key={index} className="result-card">
            <div className="result-header">
              <div className="result-info">
                <div className="result-number">{index + 1}</div>
                <h3>{evalItem.question}</h3>
              </div>
              <div className="result-score">
                {evalItem.evaluation.overall_score}/10
              </div>
            </div>
            <div className="result-content">
              <div className="result-item">
                <div className="item-label">Votre réponse</div>
                <div className="item-content item-answer">{evalItem.answer}</div>
              </div>

              <div className="result-item">
                <div className="item-label">Scores</div>
                <div className="scores-grid">
                  {Object.entries(evalItem.evaluation.scores).map(([key, value]) => (
                    <div key={key} className="score-item">
                      <div className="score-label">{key}</div>
                      <div className="score-number">{value}/10</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feedback">
                <div className="feedback-item">
                  <div className="feedback-label">💬 Feedback</div>
                  <div className="feedback-content">{evalItem.evaluation.feedback}</div>
                </div>
                <div className="feedback-item">
                  <div className="feedback-label">💡 Suggestions</div>
                  <div className="feedback-content">{evalItem.evaluation.suggestions}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="reset">
        <Button onClick={onReset} variant="outline">🔁 Recommencer</Button>
        <Button onClick={onSaveResults} variant="secondary">💾 Sauvegarder</Button>
        <Button
          onClick={onExportPDF}
          loading={isExporting}
          variant="primary"
        >
          🖨️ Exporter PDF
        </Button>
      </div>
    </div>
  );
};

export default ResultsPage;
