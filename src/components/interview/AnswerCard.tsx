// src/components/interview/AnswerCard.tsx
import React from 'react';
import Button from '../common/Button';

interface AnswerCardProps {
  answer: string;
  setAnswer: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  showTextarea?: boolean;
}

const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  setAnswer,
  isLoading,
  onSubmit,
  showTextarea = true,
}) => {
  return (
    <div className="answer-section">
      <div className="answer-header">
        <h3>Votre réponse</h3>
        <p>Structurez une réponse complète avec des exemples concrets</p>
      </div>
      <div className="input-container">
        {showTextarea && (
          <textarea
            className="textarea answer-textarea"
            placeholder={`Votre réponse détaillée...

Conseils :
• Utilisez des exemples concrets
• Quantifiez vos résultats
• Structurez votre réponse
• Montrez votre réflexion`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        )}

        {!showTextarea && answer.trim() && (
          <div className="transcribed-answer">
            <h4>Réponse transcrite (modifiable):</h4>
            <textarea
              className="textarea answer-textarea transcribed"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Votre réponse transcrite apparaîtra ici..."
            />
          </div>
        )}

        <div className="answer-footer">
          <div className="char-count">{answer.length} caractères</div>
          <Button
            variant="primary"
            loading={isLoading}
            disabled={!answer.trim()}
            onClick={onSubmit}
          >
            {isLoading ? 'Évaluation...' : 'Valider la réponse'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .transcribed-answer {
          margin-bottom: 1rem;
        }

        .transcribed-answer h4 {
          margin: 0 0 0.5rem 0;
          color: #495057;
          font-size: 0.9rem;
        }

        .textarea.transcribed {
          background-color: #f8f9fa;
          border-color: #007bff;
        }
      `}</style>
    </div>
  );
};

export default AnswerCard;
