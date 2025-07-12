'use client';

import React, { useState } from 'react';
import SetupPage from '../components/setup/SetupPage';
import InterviewPage from '../components/interview/InterviewPage';
import ResultsPage from '../components/results/ResultsPage';
import { Evaluation } from '../types';
import { sampleResume, sampleJobPosting, sampleResults } from '@/utils/mockData';
import { exportToPDF } from '@/utils/pdfExport'; 

export default function HomePage() {
  const [resumeText, setResumeText] = useState<string | null>('');
  const [jobPosting, setJobPosting] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluationResults, setEvaluationResults] = useState<Evaluation[]>([]);
  const [currentStep, setCurrentStep] = useState<'setup' | 'interview' | 'results'>('setup');
  const [isExporting, setIsExporting] = useState(false);

  const onGenerateQuestions = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobPosting }),
      });
  
      const data = await response.json();
  
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }
  
      setQuestions(data.questions);
      setCurrentQuestion(0);
      setCurrentStep('interview');
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitAnswer = async () => {
    try {
      setIsLoading(true);
      const question = questions[currentQuestion];
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer: userAnswer }),
      });
      const data = await res.json();
      if (data.success) {
        const newEval: Evaluation = {
          question,
          answer: userAnswer,
          evaluation: data.evaluation,
        };
        setEvaluationResults((prev) => [...prev, newEval]);
        setUserAnswer('');
        
        // Automatically move to next question or finish interview
        if (currentQuestion < questions.length - 1) {
          // Move to next question
          setCurrentQuestion((prev) => prev + 1);
        } else {
          // This was the last question, finish the interview
          setCurrentStep('results');
        }
      } else {
        setError('Erreur évaluation');
      }
    } catch {
      setError('Erreur serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const onNextQuestion = () => {
    setCurrentQuestion((prev) => prev + 1);
  };

  const onFinishInterview = () => {
    setCurrentStep('results');
  };

  const onReset = () => {
    setResumeText('');
    setJobPosting('');
    setQuestions([]);
    setUserAnswer('');
    setCurrentQuestion(0);
    setEvaluationResults([]);
    setCurrentStep('setup');
  };

  const onSaveResults = () => {
    alert('Résultats sauvegardés !');
  };

  const onExportPDF = async () => {
    if (evaluationResults.length === 0) {
      alert('Aucun résultat à exporter');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportToPDF(evaluationResults);
      if (result.success) {
        alert(`PDF exporté avec succès: ${result.fileName}`);
      } else {
        alert('Erreur lors de l\'export PDF');
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="app">
      {currentStep === 'setup' && (
        <SetupPage
          resumeText={resumeText}
          setResumeText={setResumeText}
          jobPosting={jobPosting}
          setJobPosting={setJobPosting}
          error={error}
          isLoading={isLoading}
          onGenerateQuestions={onGenerateQuestions}
          onTestConnection={() => alert('✅ Connection ok')}
          onFillSample={() => {
            setResumeText(sampleResume);
            setJobPosting(sampleJobPosting);
          }}
          onShowDemo={() => alert('🎥 Demo bientôt')}
        />
      )}

      {currentStep === 'interview' && (
        <InterviewPage
          questions={questions}
          currentQuestion={currentQuestion}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          onSubmitAnswer={onSubmitAnswer}
          isLoading={isLoading}
          error={error}
          onNextQuestion={onNextQuestion}
          onFinishInterview={onFinishInterview}
        />
      )}

      {currentStep === 'results' && (
        <ResultsPage
          evaluationResults={evaluationResults}
          onReset={onReset}
          onSaveResults={onSaveResults}
          onExportPDF={onExportPDF}
          isExporting={isExporting}
        />
      )}
    </main>
  );
}