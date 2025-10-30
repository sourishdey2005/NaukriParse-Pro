export interface KeywordAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface AnalysisResult {
  matchScore: number;
  strengths: string[];
  areasForImprovement: string[];
  actionVerbs: string[];
  quantification: string[];
  clarityAndConciseness: string[];
  keywordAnalysis: KeywordAnalysis;
  suggestedResumeSummary: string;
}

export interface InterviewQuestion {
  question: string;
  suggestedAnswer: string;
}

export interface InterviewPrep {
  behavioralQuestions: InterviewQuestion[];
  technicalQuestions: InterviewQuestion[];
}