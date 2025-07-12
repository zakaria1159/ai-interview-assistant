// src/components/interview/InterviewPage.tsx
import React, { useState } from 'react';
import Button from '../common/Button';
import VoiceRecorder from './VoiceRecorder';
import TextToSpeech from './TextToSpeech';

interface InterviewPageProps {
  questions: string[];
  currentQuestion: number;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  onSubmitAnswer: () => void;
  isLoading: boolean;
  error: string;
  onNextQuestion: () => void;
  onFinishInterview: () => void;
}

const InterviewPage: React.FC<InterviewPageProps> = ({
  questions,
  currentQuestion,
  userAnswer,
  setUserAnswer,
  onSubmitAnswer,
  isLoading,
  error,
  onNextQuestion,
  onFinishInterview,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('voice'); // Default to voice for more natural flow
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [questionHasBeenRead, setQuestionHasBeenRead] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleVoiceTranscription = (transcription: string) => {
    setUserAnswer(transcription);
  };

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      onSubmitAnswer();
      // Reset for next question
      setQuestionHasBeenRead(false);
    }
  };

  const handleQuestionStart = () => {
    setAiIsSpeaking(true);
  };

  const handleQuestionEnd = () => {
    setAiIsSpeaking(false);
    setQuestionHasBeenRead(true);
  };

  const handleQuestionError = (error: string) => {
    console.error('TTS Error:', error);
    setAiIsSpeaking(false);
    setQuestionHasBeenRead(true); // Allow user to proceed even if TTS fails
  };

  const canSubmit = userAnswer.trim().length > 0 && !isLoading && !isRecording && !aiIsSpeaking;
  const canRecord = questionHasBeenRead && !aiIsSpeaking && !isLoading;

  return (
    <div className="container">
      {/* Progress Section */}
      <div className="progress-section">
        <h2 className="progress-title">🤖 Entretien IA en cours</h2>
        <div className="progress-info">
          <span>Question {currentQuestion + 1} sur {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* AI Interviewer Section */}
      <div className="question-section">
        <div className="question-header">
          <div className="question-number">{currentQuestion + 1}</div>
          <h3>Question de l'IA Recruteur</h3>
        </div>
        <div className="question-content">
          <p>{questions[currentQuestion]}</p>
          
          <TextToSpeech
            text={questions[currentQuestion]}
            autoPlay={true}
            onStart={handleQuestionStart}
            onEnd={handleQuestionEnd}
            onError={handleQuestionError}
          />
        </div>
      </div>

      {/* Input Mode Selector - Only show after question is read */}
      {questionHasBeenRead && !aiIsSpeaking && (
        <div className="input-mode-selector">
          <button
            className={`btn btn-outline ${inputMode === 'text' ? 'btn-primary' : ''}`}
            onClick={() => setInputMode('text')}
            disabled={isRecording}
          >
            ✍️ Écrire
          </button>
          <button
            className={`btn btn-outline ${inputMode === 'voice' ? 'btn-primary' : ''}`}
            onClick={() => setInputMode('voice')}
            disabled={isLoading}
          >
            🎤 Répondre oralement
          </button>
        </div>
      )}

      {/* Answer Section - Only show after question is read */}
      {questionHasBeenRead && !aiIsSpeaking && (
        <div className="answer-section">
          <div className="answer-header">
            <h3>Votre réponse</h3>
            <p>
              {inputMode === 'text' 
                ? 'Répondez de manière détaillée et donnez des exemples concrets'
                : 'Parlez clairement pendant au moins 3 secondes'
              }
            </p>
          </div>
          <div className="input-container">
            {inputMode === 'text' ? (
              <>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Tapez votre réponse ici..."
                  className="textarea answer-textarea"
                  disabled={isRecording || !canRecord}
                />
                <div className="char-count">
                  {userAnswer.length} caractères
                </div>
              </>
            ) : (
              <div className="voice-input-section">
                <VoiceRecorder
                  onTranscription={handleVoiceTranscription}
                  onRecordingChange={setIsRecording}
                  isProcessing={isLoading}
                />
                {userAnswer && (
                  <div className="item-content" style={{ marginTop: '1rem' }}>
                    <div className="item-label">✓ Réponse enregistrée - Prête à soumettre</div>
                    <button
                      className="btn btn-outline"
                      onClick={() => setInputMode('text')}
                      style={{ marginTop: '0.5rem' }}
                    >
                      ✏️ Voir/Modifier le texte
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Speaking Status */}
      {aiIsSpeaking && (
        <div className="alert">
          <div className="alert-icon">🤖</div>
          <div><strong>L'IA vous pose la question...</strong> Écoutez attentivement puis répondez</div>
        </div>
      )}

      {/* Waiting Status */}
      {!questionHasBeenRead && !aiIsSpeaking && (
        <div className="alert">
          <div className="alert-icon">⏳</div>
          <div><strong>Préparation de la question...</strong> L'IA va vous poser la question dans un instant</div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert">
          <div className="alert-icon">⚠️</div>
          <div>{error}</div>
        </div>
      )}

      {/* Submit Button - Only show when ready */}
      {questionHasBeenRead && !aiIsSpeaking && (
        <div className="generate">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn btn-primary btn-large"
          >
            {isLoading && <div className="spinner"></div>}
            {isLoading 
              ? 'Évaluation en cours...' 
              : isLastQuestion 
                ? '🏁 Terminer l\'entretien'
                : '➡️ Question suivante'
            }
          </button>
        </div>
      )}

      {/* Voice Recording Tip */}
      {inputMode === 'voice' && !userAnswer && questionHasBeenRead && !aiIsSpeaking && (
        <div className="alert">
          <div className="alert-icon">🎤</div>
          <div><strong>Conseil audio:</strong> Parlez clairement pendant au moins 3 secondes pour une bonne transcription</div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;