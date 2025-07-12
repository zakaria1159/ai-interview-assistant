// src/components/interview/QuestionCard.tsx
import React from 'react';

interface QuestionCardProps {
  questionNumber: number;
  questionText?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ questionNumber, questionText }) => {
  return (
    <div className="question-section">
      <div className="question-header">
        <span className="question-number">{questionNumber}</span>
        <h3>Question {questionNumber}</h3>
      </div>
      <div className="question-content">
        <p>{questionText || 'Question non disponible'}</p>
      </div>
    </div>
  );
};

export default QuestionCard;
