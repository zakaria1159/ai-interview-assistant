// src/components/results/ResultCard.tsx
import React from 'react';
import type { EvaluationData } from '@/types';

interface Result {
  questionText?: string;
  answerText?: string;
  evalData?: EvaluationData;
}

interface ResultCardProps {
  result: Result;
  questionNumber: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, questionNumber }) => {
  const evalData: EvaluationData = result.evalData || {
    overall_score: 0,
    feedback: 'Feedback non disponible',
    suggestions: 'Suggestions non disponibles',
    scores: {},
  };

  const scores = evalData.scores || {};

  // Helper functions to safely access data
  const getOverallScore = (data: EvaluationData): number => {
    return data.overall_score || 0;
  };

  const getTextValue = (data: EvaluationData, field: keyof EvaluationData): string => {
    const value = data[field];
    if (typeof value === 'string') {
      return value || `${field} non disponible`;
    }
    return `${field} non disponible`;
  };

  const formatScoreLabel = (key: string): string => {
    // Convert camelCase or snake_case to proper labels
    const labelMap: { [key: string]: string } = {
      'relevance': 'Pertinence',
      'clarity': 'Clarté',
      'examples': 'Exemples',
      'competency': 'Compétences',
      'professionalism': 'Professionnalisme',
      'technical_skills': 'Compétences Techniques',
      'communication': 'Communication',
      'problem_solving': 'Résolution de Problèmes',
      'experience': 'Expérience',
      'motivation': 'Motivation'
    };

    return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-info">
          <span className="result-number">{questionNumber}</span>
          <h3>Question {questionNumber}</h3>
        </div>
        <div className="result-score">
          {getOverallScore(evalData)}/10
        </div>
      </div>

      <div className="result-content">
        {/* Question */}
        <div className="result-item">
          <div className="item-label">Question</div>
          <div className="item-content">
            {result.questionText || 'Question non disponible'}
          </div>
        </div>

        {/* Answer */}
        <div className="result-item">
          <div className="item-label">Votre réponse</div>
          <div className="item-content item-answer">
            {result.answerText
              ? result.answerText.length > 200
                ? result.answerText.substring(0, 200) + '...'
                : result.answerText
              : 'Réponse non disponible'}
          </div>
        </div>

        {/* Scores */}
        {Object.keys(scores).length > 0 && (
          <div className="result-item">
            <div className="item-label">Scores détaillés</div>
            <div className="scores-grid">
              {Object.entries(scores).map(([key, value]) => (
                <div key={key} className="score-item">
                  <div className="score-label">{formatScoreLabel(key)}</div>
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
              {getTextValue(evalData, 'feedback')}
            </div>
          </div>

          <div className="feedback-item">
            <div className="feedback-label">Suggestions</div>
            <div className="feedback-content">
              {getTextValue(evalData, 'suggestions')}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .result-card {
          background: var(--white);
          border: 2px solid var(--gray-300);
          margin-bottom: 2rem;
          transition: transform 0.2s ease;
        }

        .result-card:hover {
          transform: translateY(-2px);
          box-shadow: 4px 4px 0 var(--black);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid var(--gray-300);
          background: var(--gray-50);
        }

        .result-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .result-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: var(--yellow);
          color: var(--black);
          font-weight: 700;
          border: 2px solid var(--black);
        }

        .result-info h3 {
          margin: 0;
          color: var(--black);
          font-size: 1.1rem;
        }

        .result-score {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--black);
          padding: 0.5rem 1rem;
          background: var(--white);
          border: 2px solid var(--black);
        }

        .result-content {
          padding: 2rem;
        }

        .result-item {
          margin-bottom: 2rem;
        }

        .result-item:last-child {
          margin-bottom: 0;
        }

        .item-label {
          font-weight: 600;
          color: var(--black);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .item-content {
          color: var(--gray-700);
          line-height: 1.6;
          padding: 1rem;
          background: var(--gray-50);
          border-left: 4px solid var(--yellow);
        }

        .item-answer {
          font-style: italic;
        }

        .scores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .score-item {
          background: var(--white);
          border: 2px solid var(--gray-300);
          padding: 1rem;
          text-align: center;
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
          border-left: 4px solid var(--gray-400);
        }

        @media (max-width: 768px) {
          .result-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .result-content {
            padding: 1.5rem;
          }

          .scores-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }

          .score-number {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultCard;