// src/components/results/ResultCard.tsx

import React from 'react';
import { dataHelpers } from '@/utils/api';
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

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-info">
          <span className="result-number">{questionNumber}</span>
          <h3>Question {questionNumber}</h3>
        </div>
        <div className="result-score">
          {dataHelpers.getOverallScore(evalData)}/10
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
        <div className="result-item">
          <div className="item-label">Scores détaillés</div>
          <div className="scores-grid">
            {Object.entries(scores).map(([key, value]) => (
              <div key={key} className="score-item">
                <div className="score-label">{key}</div>
                <div className="score-number">{value}/10</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="feedback">
          <div className="feedback-item">
            <div className="feedback-label">Feedback</div>
            <div className="feedback-content">
              {dataHelpers.getTextValue(evalData, 'feedback')}
            </div>
          </div>

          <div className="feedback-item">
            <div className="feedback-label">Suggestions</div>
            <div className="feedback-content">
              {dataHelpers.getTextValue(evalData, 'suggestions')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
