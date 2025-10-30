import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, InterviewPrep } from '../types';

// Helper function to initialize the AI client just-in-time
const getAiClient = () => {
  // FIX: Use process.env.API_KEY as per the guidelines to retrieve the API key.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // FIX: Update the error message to reflect the correct environment variable name.
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

const getInterviewPrepSchema = () => ({
    type: Type.OBJECT,
    properties: {
        behavioralQuestions: {
            type: Type.ARRAY,
            description: "A list of behavioral interview questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    suggestedAnswer: { type: Type.STRING, description: "A detailed sample answer using the STAR method based on the candidate's resume." }
                },
                required: ["question", "suggestedAnswer"]
            }
        },
        technicalQuestions: {
            type: Type.ARRAY,
            description: "A list of technical or role-specific interview questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    suggestedAnswer: { type: Type.STRING, description: "A detailed sample answer based on the candidate's resume and best practices." }
                },
                required: ["question", "suggestedAnswer"]
            }
        }
    },
    required: ["behavioralQuestions", "technicalQuestions"]
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
      contents: {role: 'user', parts: [{text: prompt}]},
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
        contents: {role: 'user', parts: [{text: prompt}]},
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

export const tailorResume = async (resumeText: string, analysis: AnalysisResult): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
    You are an expert resume writer and career coach. Your task is to revise and enhance the provided resume based on a detailed analysis.
    Incorporate the feedback to make the resume stronger and more aligned with the target job.
    
    **Instructions:**
    1.  Start with the 'Original Resume'.
    2.  Rewrite the professional summary using the 'Suggested Resume Summary'.
    3.  Integrate the 'Missing Keywords' naturally throughout the resume, especially in the experience and skills sections.
    4.  Refine the experience section by applying the feedback from 'Areas for Improvement', 'Action Verbs', and 'Quantification'. Make bullet points more impactful.
    5.  Ensure the final resume is clear, concise, and professionally formatted.
    6.  Return only the full text of the revised resume. Do not include any of your own commentary or headings like "Revised Resume".

    **Analysis Feedback:**
    ${JSON.stringify({
        suggestedResumeSummary: analysis.suggestedResumeSummary,
        areasForImprovement: analysis.areasForImprovement,
        keywordAnalysis: analysis.keywordAnalysis,
        actionVerbs: analysis.actionVerbs,
        quantification: analysis.quantification,
    }, null, 2)}

    **Original Resume:**
    ${resumeText}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: {role: 'user', parts: [{text: prompt}]},
            config: {
                temperature: 0.4,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error tailoring resume with Gemini API:", error);
        throw new Error("Failed to tailor the resume. Please try again.");
    }
};

export const generateInterviewQuestions = async (resumeText: string, jobDescription: string, role: string): Promise<InterviewPrep> => {
    const ai = getAiClient();
    const prompt = `
    **Role:** You are an expert hiring manager and career coach for the **${role}** field.

    **Task:** Based on the candidate's resume and the target job description, generate a list of likely interview questions.
    - Create 3-4 behavioral questions.
    - Create 2-3 technical or role-specific questions.
    - For each question, provide a strong, detailed sample answer using the STAR method (Situation, Task, Action, Result) where applicable, drawing specifics from the provided resume.
    - The answers should be from the perspective of the candidate.

    **Candidate's Resume:**
    ${resumeText}

    **Job Description:**
    ${jobDescription}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: {role: 'user', parts: [{text: prompt}]},
            config: {
                responseMimeType: "application/json",
                responseSchema: getInterviewPrepSchema(),
                temperature: 0.5,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating interview questions with Gemini API:", error);
        throw new Error("Failed to generate interview questions. The model may have returned an invalid format.");
    }
};

export const generateLinkedInPost = async (resumeText: string, jobDescription: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
    You are a professional branding expert. Your task is to write a short, engaging, and professional LinkedIn post (under 300 characters).
    
    **Instructions:**
    1.  The post is for a candidate who has just applied for a job.
    2.  Infer the Job Title and Company Name from the job description.
    3.  The post should express excitement about the opportunity.
    4.  It must highlight one key skill or achievement from the resume that is highly relevant to the job description.
    5.  The tone should be professional and confident.
    6.  Do not use hashtags.
    7.  Return only the text of the post.

    **Resume:**
    ${resumeText}

    **Job Description:**
    ${jobDescription}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {role: 'user', parts: [{text: prompt}]},
            config: {
                temperature: 0.6,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating LinkedIn post with Gemini API:", error);
        throw new Error("Failed to generate the LinkedIn post. Please try again.");
    }
};
