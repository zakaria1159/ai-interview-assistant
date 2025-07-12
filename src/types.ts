export interface ScoreDetails {
    [key: string]: number;
  }
  
  export interface EvaluationData {
    scores: ScoreDetails;
    overall_score: number;
    feedback: string;
    suggestions: string;
  }
  
  export interface Evaluation {
    question: string;
    answer: string;
    evaluation: EvaluationData;
  }
  