export interface VideoAnalysisData {
  posture: {
    score: number;
    faceCentered: boolean;
    faceVisible: boolean;
    appropriateDistance: boolean;
    faceSize?: number;              // Optional for backward compatibility
    horizontalAlignment?: number;   // Optional for backward compatibility  
    verticalAlignment?: number;     // Optional for backward compatibility
  };
  movement: {
    score: number;
    fidgetingLevel: number;
    stability: number;
    headMovement?: number;          // Optional for backward compatibility
  };
  audioQuality: {
    score: number;
    volumeLevel: number;
    clarity: number;
    consistency: number;
  };
  overall: {
    score: number;
    timestamp: number;
  };
  faceDetection?: {                 // NEW: Optional MediaPipe data
    detectionCount: number;
    confidence: number;
    landmarks: any[];
    realMediaPipe?: boolean;        // Flag to identify real vs mock data
  };
}
  
  export interface ProcessedVideoAnalysis {
    postureScore: number;
    stabilityScore: number;
    voiceQualityScore: number;
    presenceScore: number;
    professionalismScore: number;
    overallBehavioralScore: number;
    breakdown: {
      posture: {
        score: number;
        feedback: string;
        details: string;
      };
      stability: {
        score: number;
        feedback: string;
        details: string;
      };
      voiceQuality: {
        score: number;
        feedback: string;
        details: string;
      };
      presence: {
        score: number;
        feedback: string;
        details: string;
      };
      professionalism: {
        score: number;
        feedback: string;
        details: string;
      };
    };
    analytics: {
      totalMeasures: number;
      analysisTimeMinutes: number;
      consistencyScore: number;
      improvementAreas: string[];
      strengths: string[];
    };
  }
  
  // This is the structure that your API returns (based on the error message)
  export interface EvaluationData {
    overall_score: number;
    scores: {
      [key: string]: number;
    };
    feedback: string;
    suggestions: string;
  }
  
  // This is the structure used in your HomePage
  export interface Evaluation {
    question: string;
    answer: string;
    evaluation: EvaluationData; // Use EvaluationData here
    videoAnalysis?: VideoAnalysisData[];
  }
  
  // Alternative legacy structure (if you need backwards compatibility)
  export interface LegacyEvaluation {
    question: string;
    answer: string;
    evaluation: {
      score: number;
      feedback: string;
      criteria: {
        relevance: number;
        clarity: number;
        examples: number;
        competency: number;
        professionalism: number;
      };
      suggestions: string[];
    };
    videoAnalysis?: VideoAnalysisData[];
  }
  
  // Result structure for ResultCard
  export interface Result {
    questionText?: string;
    answerText?: string;
    evalData?: EvaluationData;
  }
  
  // Helper type for score mapping
  export interface ScoreMapping {
    [key: string]: number;
  }