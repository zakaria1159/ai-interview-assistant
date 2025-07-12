// src/components/results/OverallScore.tsx
import React from 'react';

interface OverallScoreProps {
  score: number;
}

const OverallScore: React.FC<OverallScoreProps> = ({ score }) => {
  const getScoreDescription = (score: number): string => {
    if (score >= 8) return 'Performance excellente';
    if (score >= 6) return 'Bonne performance';
    if (score >= 4) return 'Performance correcte';
    return 'Points d\'amélioration identifiés';
  };

  return (
    <div className="overall-score">
      <div className="score-display">
        <span className="score-value">{Math.round(score * 10) / 10}</span>
        <span className="score-total">/10</span>
      </div>
      <div className="score-description">
        {getScoreDescription(score)}
      </div>
    </div>
  );
};

export default OverallScore;
