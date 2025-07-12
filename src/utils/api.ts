const API_URL = 'http://localhost:3000';

export interface EvaluationScores {
  [key: string]: number;
}

export interface EvalData {
  overall_score: number;
  scores: EvaluationScores;
  feedback: string;
  suggestions: string;
}

export interface EvaluationResult {
  questionText: string;
  answerText: string;
  evalData: EvalData;
}

export const api = {
  // Test connection
  testConnection: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/api/test`);
    return response.json();
  },

  // Generate questions
  generateQuestions: async (
    resumeText: string,
    jobPosting: string
  ): Promise<{ success: boolean; questions: string[] }> => {
    const response = await fetch(`${API_URL}/api/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobPosting }),
    });

    return response.json();
  },

  // Evaluate answer
  evaluateAnswer: async (
    question: string,
    answer: string,
    context: string
  ): Promise<any> => {
    const response = await fetch(`${API_URL}/api/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, context }),
    });

    return response.json();
  },
};

// Helper functions for data processing
export const dataHelpers = {
  getScoreValue: (evalData: EvalData | null, key: string): number => {
    try {
      if (
        evalData &&
        evalData.scores &&
        typeof evalData.scores[key] === 'number'
      ) {
        return evalData.scores[key];
      }
      return 5;
    } catch {
      return 5;
    }
  },

  getOverallScore: (evalData: EvalData | null): number => {
    try {
      if (evalData && typeof evalData.overall_score === 'number') {
        return evalData.overall_score;
      }
      return 5;
    } catch {
      return 5;
    }
  },

  getTextValue: (
    evalData: EvalData | null,
    key: keyof EvalData,
    defaultText = 'Évaluation non disponible'
  ): string => {
    try {
      if (evalData && typeof evalData[key] === 'string') {
        return evalData[key] as string;
      }
      return defaultText;
    } catch {
      return defaultText;
    }
  },

  calculateOverallScore: (evaluationResults: EvaluationResult[]): number => {
    const validResults = evaluationResults.filter(
      (result) => result && result.evalData
    );
    return validResults.length > 0
      ? validResults.reduce(
          (acc, result) =>
            acc + dataHelpers.getOverallScore(result.evalData),
          0
        ) / validResults.length
      : 0;
  },
};
