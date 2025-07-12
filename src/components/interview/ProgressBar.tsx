// src/components/interview/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  progressValue: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentQuestion,
  totalQuestions,
  progressValue
}) => {
  return (
    <div className="progress-section">
      <h2 className="progress-title">Entretien en cours</h2>
      <div className="progress-info">
        <span>Question {currentQuestion} sur {totalQuestions}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
