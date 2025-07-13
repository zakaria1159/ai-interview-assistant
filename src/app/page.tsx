'use client';

import React, { useCallback, useState } from 'react';
import SetupPage from '../components/setup/SetupPage';
import InterviewPage from '../components/interview/InterviewPage';
import ResultsPage from '../components/results/ResultsPage';
import { MediaProvider } from '../components/interview/SharedMediaManager';
import { Evaluation, VideoAnalysisData, EvaluationData } from '../types';
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
  const [videoAnalysisData, setVideoAnalysisData] = useState<VideoAnalysisData[]>([]);
  const [currentQuestionVideoData, setCurrentQuestionVideoData] = useState<VideoAnalysisData[]>([]);

  const clearError = () => {
    setError('');
  };

  const handleVideoAnalysisUpdate = useCallback((analysis: VideoAnalysisData) => {
    console.log('📊 Received video analysis:', analysis);
    // Add to current question's data
    setCurrentQuestionVideoData(prev => [...prev, analysis]);
    // Also add to overall data for debugging/tracking
    setVideoAnalysisData(prev => [...prev, analysis]);
  }, []);

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
      setCurrentQuestionVideoData([]); // Reset video data for new interview
      setVideoAnalysisData([]);
      setCurrentStep('interview');
      console.log('🚀 Starting interview with', data.questions.length, 'questions');
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitAnswer = async (resultData?: any) => {
    try {
      setIsLoading(true);
      setError('');
      
      const question = questions[currentQuestion];
      // Use video data from InterviewPage if provided, otherwise use homepage data
      const videoData = resultData?.videoAnalysis || currentQuestionVideoData;
      
      console.log('📝 Submitting answer for question', currentQuestion + 1);
      console.log('📊 Video analysis data:', videoData.length, 'data points');
      
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          answer: resultData?.answer || userAnswer,
          videoAnalysis: videoData // Use the combined video data
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        const evaluation: EvaluationData = data.evaluation;
        
        const newEval: Evaluation = {
          question,
          answer: resultData?.answer || userAnswer,
          evaluation: evaluation,
          videoAnalysis: videoData, // Store the actual video data
        };
        
        setEvaluationResults((prev) => [...prev, newEval]);
        setUserAnswer('');
        setCurrentQuestionVideoData([]); // Clear homepage video data
        
        console.log('✅ Saved result with', videoData.length, 'video analysis items');
        
        // Continue with next question logic...
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);
        } else {
          setCurrentStep('results');
        }
      } else {
        setError(data.error || 'Erreur lors de l\'évaluation');
      }
    } catch (err: any) {
      console.error('❌ Error submitting answer:', err);
      setError('Erreur serveur lors de l\'évaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const onNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      console.log('⏭️ Manual next question:', currentQuestion + 2);
      setCurrentQuestion((prev) => prev + 1);
      setCurrentQuestionVideoData([]); // Clear video data for new question
    }
  };

  const onFinishInterview = () => {
    console.log('🎯 Finishing interview manually');
    setCurrentStep('results');
  };

  const onReset = () => {
    console.log('🔄 Resetting interview');
    setResumeText('');
    setJobPosting('');
    setQuestions([]);
    setUserAnswer('');
    setCurrentQuestion(0);
    setEvaluationResults([]);
    setVideoAnalysisData([]);
    setCurrentQuestionVideoData([]);
    setCurrentStep('setup');
    setError('');
  };

  const onSaveResults = () => {
    // TODO: Implement actual save functionality
    console.log('💾 Saving results:', evaluationResults.length, 'evaluations');
    alert('Résultats sauvegardés !');
  };

  const onExportPDF = async () => {
    if (evaluationResults.length === 0) {
      alert('Aucun résultat à exporter');
      return;
    }

    setIsExporting(true);
    try {
      console.log('📄 Exporting PDF with', evaluationResults.length, 'evaluations');
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

  const onTestConnection = async () => {
    try {
      console.log('🔗 Testing API connection...');
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('✅ Connexion API réussie !');
      } else {
        alert('⚠️ Problème de connexion API');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('❌ Erreur de connexion API');
    }
  };

  const onFillSample = () => {
    console.log('📋 Filling sample data');
    setResumeText(sampleResume);
    setJobPosting(sampleJobPosting);
  };

  const onShowDemo = () => {
    console.log('🎥 Demo requested');
    alert('🎥 Demo vidéo bientôt disponible');
  };

  // Debug information
  console.log('🏠 HomePage State:', {
    currentStep,
    currentQuestion: currentQuestion + 1,
    totalQuestions: questions.length,
    currentQuestionVideoData: currentQuestionVideoData.length,
    totalVideoData: videoAnalysisData.length,
    evaluationResults: evaluationResults.length
  });

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
          onTestConnection={onTestConnection}
          onFillSample={onFillSample}
          onShowDemo={onShowDemo}
        />
      )}

      {currentStep === 'interview' && (
        <MediaProvider>
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
            clearError={clearError}
           
          />
        </MediaProvider>
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