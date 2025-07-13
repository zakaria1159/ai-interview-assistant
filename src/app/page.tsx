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
  
  // Video analysis state - UPDATED
  const [videoAnalysisData, setVideoAnalysisData] = useState<VideoAnalysisData[]>([]);
  const [currentQuestionVideoData, setCurrentQuestionVideoData] = useState<VideoAnalysisData[]>([]);

  const clearError = () => {
    setError('');
  };

  // UPDATED: Enhanced video analysis handler with better logging
  const handleVideoAnalysisUpdate = useCallback((analysis: VideoAnalysisData) => {
    console.log('📊 HomePage received video analysis:', {
      timestamp: new Date().toISOString(),
      currentQuestion: currentQuestion + 1,
      analysisData: analysis,
      hasRealMediaPipe: analysis.faceDetection?.realMediaPipe || false,
      confidence: analysis.faceDetection?.confidence || 0
    });
    
    // Add to current question's data
    setCurrentQuestionVideoData(prev => {
      const updated = [...prev, analysis];
      console.log(`📈 Current question ${currentQuestion + 1} now has ${updated.length} video analysis items`);
      return updated;
    });
    
    // Also add to overall data for tracking
    setVideoAnalysisData(prev => [...prev, analysis]);
  }, [currentQuestion]);

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
      
      // UPDATED: Reset video analysis data for new interview
      setCurrentQuestionVideoData([]);
      setVideoAnalysisData([]);
      
      setCurrentStep('interview');
      console.log('🚀 Starting interview with', data.questions.length, 'questions');
      console.log('🎥 Video analysis system initialized and ready');
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATED: Enhanced submit answer with better video data handling
  const onSubmitAnswer = async (resultData?: any) => {
    try {
      setIsLoading(true);
      setError('');
      
      const question = questions[currentQuestion];
      
      // UPDATED: Use video data from InterviewPage if provided, otherwise use HomePage data
      const videoData = resultData?.videoAnalysis || currentQuestionVideoData;
      
      console.log('📝 Submitting answer for question', currentQuestion + 1, {
        question: question.substring(0, 50) + '...',
        answerLength: (resultData?.answer || userAnswer).length,
        videoDataPoints: videoData.length,
        hasMediaPipeData: videoData.some((item: VideoAnalysisData) => item.faceDetection?.realMediaPipe === true),
        videoDataSample: videoData[0] || null
      });
      
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          answer: resultData?.answer || userAnswer,
          videoAnalysis: videoData // Use the video data
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
        
        setEvaluationResults((prev) => {
          const updated = [...prev, newEval];
          console.log('✅ Saved evaluation result:', {
            questionNumber: currentQuestion + 1,
            videoAnalysisItems: videoData.length,
            totalEvaluations: updated.length,
            mediaLiteracyData: videoData.filter((item: VideoAnalysisData) => item.faceDetection?.realMediaPipe).length
          });
          return updated;
        });
        
        setUserAnswer('');
        
        // UPDATED: Clear current question video data and log transition
        console.log(`🔄 Clearing video data for question ${currentQuestion + 1} (${currentQuestionVideoData.length} items saved)`);
        setCurrentQuestionVideoData([]);
        
        // Continue with next question logic...
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => {
            const nextQ = prev + 1;
            console.log(`⏭️ Moving to question ${nextQ + 1}/${questions.length}`);
            return nextQ;
          });
        } else {
          console.log('🎯 Interview completed, moving to results');
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

  // UPDATED: Enhanced next question handler
  const onNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      console.log('⏭️ Manual next question:', {
        from: currentQuestion + 1,
        to: currentQuestion + 2,
        currentVideoData: currentQuestionVideoData.length
      });
      
      setCurrentQuestion((prev) => prev + 1);
      
      // Clear video data for new question
      console.log(`🔄 Clearing video data for manual transition (${currentQuestionVideoData.length} items discarded)`);
      setCurrentQuestionVideoData([]);
    }
  };

  // UPDATED: Enhanced finish interview handler
  const onFinishInterview = () => {
    console.log('🎯 Finishing interview manually:', {
      currentQuestion: currentQuestion + 1,
      totalQuestions: questions.length,
      currentVideoData: currentQuestionVideoData.length,
      totalVideoData: videoAnalysisData.length,
      totalEvaluations: evaluationResults.length
    });
    setCurrentStep('results');
  };

  // UPDATED: Enhanced reset handler
  const onReset = () => {
    console.log('🔄 Resetting interview:', {
      previousEvaluations: evaluationResults.length,
      previousVideoData: videoAnalysisData.length
    });
    
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
    
    console.log('✅ Interview reset complete - all data cleared');
  };

  const onSaveResults = () => {
    // TODO: Implement actual save functionality
    const totalVideoItems = evaluationResults.reduce((sum, evaluation) => sum + (evaluation.videoAnalysis?.length || 0), 0);
    const mediaPipeItems = evaluationResults.reduce((sum, evaluation) => 
      sum + (evaluation.videoAnalysis?.filter(item => item.faceDetection?.realMediaPipe).length || 0), 0
    );
    
    console.log('💾 Saving results:', {
      evaluations: evaluationResults.length,
      totalVideoItems,
      mediaPipeItems,
      successRate: totalVideoItems > 0 ? Math.round((mediaPipeItems / totalVideoItems) * 100) : 0
    });
    
    alert('Résultats sauvegardés !');
  };

  const onExportPDF = async () => {
    if (evaluationResults.length === 0) {
      alert('Aucun résultat à exporter');
      return;
    }

    setIsExporting(true);
    try {
      const totalVideoItems = evaluationResults.reduce((sum, evaluation) => sum + (evaluation.videoAnalysis?.length || 0), 0);
      console.log('📄 Exporting PDF:', {
        evaluations: evaluationResults.length,
        totalVideoItems,
        hasMediaPipeData: totalVideoItems > 0
      });
      
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

  // UPDATED: Enhanced debug information
  console.log('🏠 HomePage State Debug:', {
    currentStep,
    interview: {
      currentQuestion: currentQuestion + 1,
      totalQuestions: questions.length,
      currentQuestionVideoData: currentQuestionVideoData.length,
      totalVideoData: videoAnalysisData.length,
      evaluationResults: evaluationResults.length
    },
    videoAnalysis: {
      currentQuestionItems: currentQuestionVideoData.length,
      currentQuestionHasMediaPipe: currentQuestionVideoData.some(item => item.faceDetection?.realMediaPipe),
      totalItems: videoAnalysisData.length,
      totalMediaPipeItems: videoAnalysisData.filter(item => item.faceDetection?.realMediaPipe).length
    }
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
            onVideoAnalysisUpdate={handleVideoAnalysisUpdate} // ADDED: This is crucial!
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