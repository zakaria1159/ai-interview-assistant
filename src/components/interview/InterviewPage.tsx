// src/components/interview/InterviewPage.tsx
// Clean version with all debugging removed

import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import VoiceRecorder from './VoiceRecorder';
import TextToSpeech from './TextToSpeech';
import AIAvatar from './AIAvatar';
import VideoAnalysisShared from './VideoAnalysisShared';
import { MediaProvider } from './SharedMediaManager';

interface InterviewPageProps {
  questions: string[];
  currentQuestion: number;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  onSubmitAnswer: (result: any) => void;
  isLoading: boolean;
  error: string;
  onNextQuestion: () => void;
  onFinishInterview: () => void;
  clearError?: () => void;
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
  clearError,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('voice');
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [questionHasBeenRead, setQuestionHasBeenRead] = useState(false);
  const [videoAnalysisData, setVideoAnalysisData] = useState<any[]>([]);
  
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const videoAnalysisActive = questionHasBeenRead && !aiIsSpeaking;

  // Video analysis update handler
  const handleVideoAnalysisUpdate = useCallback((analysis: any) => {
    setVideoAnalysisData(prev => [...prev, analysis]);
  }, []);

  // Voice transcription handler
  const handleVoiceTranscription = useCallback((transcription: string) => {
    setUserAnswer(transcription);
    if (error && clearError) {
      clearError();
    }
  }, [setUserAnswer, error, clearError]);

  // Submit handler with video data
  const handleSubmit = useCallback(() => {
    if (userAnswer.trim()) {
      const resultWithVideo = {
        question: questions[currentQuestion],
        answer: userAnswer,
        videoAnalysis: videoAnalysisData,
        questionNumber: currentQuestion + 1,
        timestamp: Date.now()
      };

      if (clearError) {
        clearError();
      }

      onSubmitAnswer(resultWithVideo);
      setVideoAnalysisData([]);
    }
  }, [userAnswer, questions, currentQuestion, videoAnalysisData, onSubmitAnswer, clearError]);

  // Text-to-speech handlers
  const handleQuestionStart = useCallback(() => {
    setAiIsSpeaking(true);
  }, []);

  const handleQuestionEnd = useCallback(() => {
    setAiIsSpeaking(false);
    setQuestionHasBeenRead(true);
  }, []);

  const handleQuestionError = useCallback((error: string) => {
    console.error('TTS Error:', error);
    setAiIsSpeaking(false);
    setQuestionHasBeenRead(true);
  }, []);

  // Button states
  const canSubmit = userAnswer.trim().length > 0 && !isLoading && !isRecording && !aiIsSpeaking;
  const canRecord = questionHasBeenRead && !aiIsSpeaking && !isLoading;

  // Reset states when question changes
  useEffect(() => {
    setQuestionHasBeenRead(false);
    setAiIsSpeaking(false);
    setIsRecording(false);
    setVideoAnalysisData([]);
  }, [currentQuestion]);

  return (
    <MediaProvider>
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

        {/* Video Analysis Section */}
        <div className="video-analysis-section">
          <div className="analysis-header">
            <h4>📹 Évaluation Comportementale</h4>
            <p>
              {videoAnalysisActive 
                ? "Votre présentation est analysée pour vous fournir des conseils personnalisés" 
                : "L'analyse reprendra après la lecture de la question"
              }
            </p>
          </div>
          <VideoAnalysisShared
            isActive={videoAnalysisActive}
            onAnalysisUpdate={handleVideoAnalysisUpdate}
            showPreview={true}
          />
        </div>

        {/* AI Interviewer Section with Avatar */}
        <div className="question-section">
          <div className="question-header">
            <div className="question-number">{currentQuestion + 1}</div>
            <h3>IA Recruteur</h3>
          </div>
          <div className="question-content">
            {/* AI Avatar */}
            <div className="ai-interviewer">
              <AIAvatar
                isSpeaking={aiIsSpeaking}
                isListening={isRecording}
                isThinking={isLoading}
                avatarStyle="professional"
                size="medium"
              />
            </div>
            
            {/* Question Text */}
            <div className="question-text">
              <p>{questions[currentQuestion]}</p>
            </div>
            
            {/* Text-to-Speech Controls */}
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
                    onChange={(e) => {
                      setUserAnswer(e.target.value);
                      if (error && clearError) {
                        clearError();
                      }
                    }}
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

        <style jsx>{`
          .video-analysis-section {
            margin: 2rem 0;
          }
          
          .analysis-header {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          
          .analysis-header h4 {
            color: var(--black);
            margin-bottom: 0.5rem;
          }
          
          .analysis-header p {
            color: var(--gray-600);
            font-size: 0.9rem;
            margin: 0;
          }
        `}</style>
      </div>
    </MediaProvider>
  );
};

export default InterviewPage;