import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

// Helper function to initialize the AI client just-in-time
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key is not configured. Please ensure the API_KEY environment variable is set.");
  }
  return new GoogleGenAI({ apiKey });
};

const getAnalysisSchema = () => ({
  type: Type.OBJECT,
  properties: {
    matchScore: {
      type: Type.NUMBER,
      description: "A score from 0 to 100 representing how well the resume matches the job description.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of high-level strengths from the resume that align with the job description.",
    },
    areasForImprovement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of high-level, actionable suggestions for improving the resume for this specific job.",
    },
    actionVerbs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Feedback on the use of action verbs, with specific suggestions for improvement."
    },
    quantification: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Feedback on the use of quantifiable metrics and achievements, suggesting where to add numbers to show impact."
    },
    clarityAndConciseness: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Feedback on the resume's readability, clarity, and conciseness. Suggests removing jargon or simplifying sentences."
    },
    keywordAnalysis: {
      type: Type.OBJECT,
      properties: {
        matchedKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Keywords from the job description found in the resume.",
        },
        missingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Important keywords from the job description missing from the resume.",
        },
      },
      required: ["matchedKeywords", "missingKeywords"],
    },
    suggestedResumeSummary: {
        type: Type.STRING,
        description: "A rewritten, impactful professional summary for the resume, tailored to the job description."
    }
  },
  required: ["matchScore", "strengths", "areasForImprovement", "actionVerbs", "quantification", "clarityAndConciseness", "keywordAnalysis", "suggestedResumeSummary"],
});

export const analyzeResume = async (resumeText: string, jobDescription: string, role: string): Promise<AnalysisResult> => {
  try {
    const ai = getAiClient();
    const prompt = `
      **Role:** You are an expert ATS (Applicant Tracking System) and a professional career coach specializing in the **${role}** field.

      **Task:** Analyze the provided resume against the job description. Your feedback must be specific, constructive, and tailored to the ${role} industry. Return a detailed analysis in a structured JSON format.

      **Resume Content:**
      ${resumeText}

      **Job Description:**
      ${jobDescription}

      **Instructions:**
      1.  Calculate a "matchScore" from 0 to 100.
      2.  Identify high-level "strengths".
      3.  Pinpoint high-level "areasForImprovement".
      4.  Provide specific feedback on "actionVerbs", suggesting stronger alternatives.
      5.  Provide feedback on "quantification", suggesting where to add metrics.
      6.  Provide feedback on "clarityAndConciseness", suggesting ways to improve readability.
      7.  Perform a "keywordAnalysis" for matched and missing keywords.
      8.  Write a tailored "suggestedResumeSummary".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: getAnalysisSchema(),
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    const result: AnalysisResult = JSON.parse(jsonText);
    
    result.matchScore = Math.max(0, Math.min(100, Math.round(result.matchScore)));

    return result;
  } catch (error) {
    console.error("Error analyzing resume with Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key")) {
      throw error;
    }
    throw new Error("Failed to analyze resume. The model may have generated an invalid response. Please try again.");
  }
};


export const generateCoverLetter = async (resumeText: string, jobDescription: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const systemInstruction = `You are a professional career coach and expert cover letter writer. Your task is to write a professional and compelling cover letter based on the provided resume and job description.
- The tone should be confident, professional, and enthusiastic.
- Highlight the most relevant skills and experiences from the resume that directly match the key requirements in the job description.
- Structure it with a strong opening paragraph, 2-3 body paragraphs detailing the candidate's qualifications, and a closing paragraph with a clear call to action.
- Use placeholders like "[Your Name]", "[Your Phone Number]", "[Your Email]", "[Hiring Manager Name, or 'Hiring Team']", and "[Company Name]" where appropriate.
- Ensure the letter is concise and impactful, ideally under 400 words.`;

    const prompt = `
      **Resume:**
      ${resumeText}

      **Job Description:**
      ${jobDescription}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating cover letter with Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key")) {
      throw error;
    }
    throw new Error("Failed to generate the cover letter. Please try again.");
  }
};
