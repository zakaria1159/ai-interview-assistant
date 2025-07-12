'use client';

import React, { useEffect, useState } from 'react';
import ResultsPage from '@/components/results/ResultsPage';

interface Evaluation {
  question: string;
  answer: string;
  evaluation: {
    scores: { [key: string]: number };
    overall_score: number;
    feedback: string;
    suggestions: string;
  };
}

const Results = () => {
  const [evaluationResults, setEvaluationResults] = useState<Evaluation[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('evaluationResults');
    if (stored) {
      try {
        const parsed: Evaluation[] = JSON.parse(stored);
        setEvaluationResults(parsed);
      } catch (e) {
        console.error('Failed to parse evaluation results:', e);
      }
    }
  }, []);

  const handleReset = () => {
    localStorage.removeItem('evaluationResults');
    window.location.href = '/';
  };

  const handleSaveResults = () => {
    alert('✅ Results saved locally!');
    // Optionally send to backend here
  };

  const handleExportPDF = () => {
    setIsExporting(true);

    setTimeout(() => {
      alert('📄 PDF exported (simulation)');
      setIsExporting(false);
    }, 1500);
  };

  if (evaluationResults.length === 0) {
    return (
      <div className="container text-center py-20">
        <h2>Aucun résultat trouvé</h2>
        <p>Revenez à l'accueil pour démarrer un entretien.</p>
        <button
          onClick={handleReset}
          className="mt-4 px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
        >
          🔁 Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <ResultsPage
      evaluationResults={evaluationResults}
      onReset={handleReset}
      onSaveResults={handleSaveResults}
      onExportPDF={handleExportPDF}
      isExporting={isExporting}
    />
  );
};

export default Results;
