import React, { useState, useCallback, Fragment } from 'react';
import Header from './components/Header';
import ScoreGauge from './components/ScoreGauge';
import AnalysisCard from './components/AnalysisCard';
import { analyzeResume, generateCoverLetter } from './services/geminiService';
import type { AnalysisResult } from './types';

declare var pdfjsLib: any;
declare var mammoth: any;

type ActiveTab = 'analysis' | 'coverLetter';

const ROLES = ["General / Other", "Software Engineer", "Product Manager", "Data Analyst / Scientist", "Marketing Manager", "Sales Representative", "UX/UI Designer", "Healthcare Professional"];

const App: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [coverLetter, setCoverLetter] = useState('');
  const [isCoverLetterLoading, setIsCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setResumeText('');
    setAnalysisResult(null);
    setError(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let content = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            content += textContent.items.map((item: any) => item.str).join(' ');
          }
          setResumeText(content);
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          setResumeText(result.value);
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError('Unsupported file type. Please upload a PDF, DOC, or DOCX file.');
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      setError('Failed to parse the file. Please ensure it is not corrupted.');
    } finally {
      setIsParsing(false);
      // Reset file input to allow re-uploading the same file
      event.target.value = '';
    }
  }, []);

  const handleClearFile = () => {
    setFileName(null);
    setResumeText('');
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both the resume content and a job description.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setActiveTab('analysis');

    try {
      const result = await analyzeResume(resumeText, jobDescription, selectedRole);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
        setCoverLetterError('Resume and Job Description are required to generate a cover letter.');
        return;
    }
    setIsCoverLetterLoading(true);
    setCoverLetterError(null);
    setCoverLetter('');

    try {
        const letter = await generateCoverLetter(resumeText, jobDescription);
        setCoverLetter(letter);
    } catch (err: any) {
        setCoverLetterError(err.message || 'An unknown error occurred while generating the cover letter.');
    } finally {
        setIsCoverLetterLoading(false);
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    alert('Cover letter copied to clipboard!');
  }

  const renderAnalysisContent = () => {
    if (!analysisResult) return null;
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex flex-col items-center justify-center">
                    <ScoreGauge score={analysisResult.matchScore} />
                </div>
                <div className="lg:col-span-2">
                    <AnalysisCard title="Suggested Resume Summary" icon={<SparklesIcon />}>
                         <p className="text-slate-600 text-sm leading-relaxed">{analysisResult.suggestedResumeSummary}</p>
                    </AnalysisCard>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <AnalysisCard title="Strengths" icon={<CheckCircleIcon />}>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                        {analysisResult.strengths.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </AnalysisCard>
                <AnalysisCard title="Areas for Improvement" icon={<ExclamationTriangleIcon />}>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                        {analysisResult.areasForImprovement.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </AnalysisCard>
                 <AnalysisCard title="Keyword Analysis" icon={<MagnifyingGlassIcon />}>
                    <div className="text-sm">
                        <h4 className="font-semibold text-emerald-600 mb-2">Matched Keywords</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {analysisResult.keywordAnalysis.matchedKeywords.map((kw, i) => <span key={i} className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
                        </div>
                         <h4 className="font-semibold text-red-600 mb-2">Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.keywordAnalysis.missingKeywords.map((kw, i) => <span key={i} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
                        </div>
                    </div>
                </AnalysisCard>
                <AnalysisCard title="Action Verbs" icon={<BoltIcon />}>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                        {analysisResult.actionVerbs.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </AnalysisCard>
                 <AnalysisCard title="Quantification" icon={<ChartBarIcon />}>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                        {analysisResult.quantification.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </AnalysisCard>
                 <AnalysisCard title="Clarity & Conciseness" icon={<PencilSquareIcon />}>
                     <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                        {analysisResult.clarityAndConciseness.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </AnalysisCard>
            </div>
        </div>
    );
  }

  const renderCoverLetterContent = () => {
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Cover Letter Generator</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Leverage the power of AI to create a compelling cover letter based on your resume and the job description. Click the button below to generate a draft.
                </p>
                <button
                    onClick={handleGenerateCoverLetter}
                    disabled={isCoverLetterLoading}
                    className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-colors"
                >
                    {isCoverLetterLoading ? 'Generating...' : 'Generate Cover Letter'}
                </button>
            </div>
            
            {coverLetterError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{coverLetterError}</div>}
            
            {isCoverLetterLoading && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="ml-3 text-slate-600">AI is writing your cover letter...</p>
                    </div>
                </div>
            )}
            
            {coverLetter && (
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Generated Cover Letter</h4>
                        <button onClick={handleCopyCoverLetter} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-lg transition-colors">Copy</button>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
                        {coverLetter}
                    </div>
                </div>
            )}

        </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 sticky top-28">
            <div className="space-y-6">
               <div>
                  <label htmlFor="role-select" className="block text-sm font-semibold text-slate-700 mb-2">Select Your Target Role/Industry</label>
                  <select 
                    id="role-select" 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Resume</label>
                <div className="mt-1">
                   <label 
                     htmlFor="file-upload" 
                     className="relative cursor-pointer bg-white rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 p-4 flex justify-center items-center transition-colors"
                    >
                    <div className="text-center">
                        <FileIcon />
                        <p className="mt-1 text-sm text-slate-600">
                            <span className="font-semibold text-indigo-600">Upload a file</span> or paste content below
                        </p>
                        <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                     <input id="file-upload" name="file-upload" type="file" className="file-input-hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                  </label>
                  
                  {fileName && (
                    <div className="mt-2 flex items-center justify-between bg-slate-100 p-2 rounded-md text-sm">
                      <span className="font-medium text-slate-700 truncate">{isParsing ? 'Parsing...' : fileName}</span>
                      <button onClick={handleClearFile} className="text-slate-500 hover:text-red-600">&times;</button>
                    </div>
                  )}

                  <textarea
                    rows={8}
                    className="mt-2 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="...or paste your resume content here."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="job-description" className="block text-sm font-semibold text-slate-700">Job Description</label>
                <div className="mt-1">
                  <textarea
                    id="job-description"
                    rows={8}
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Paste the full job description here for the most accurate analysis."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 transition-all transform hover:scale-105"
              >
                {isLoading ? 'Analyzing...' : 'Analyze My Resume'}
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            {isLoading && (
              <div className="flex justify-center items-center h-96 bg-white rounded-2xl shadow-lg border border-slate-200">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Analyzing your resume, this may take a moment...</p>
                  </div>
              </div>
            )}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}
            
            {analysisResult && (
                 <div className="space-y-6">
                    {/* Tabs */}
                    <div className="bg-white rounded-xl p-1.5 shadow-md border border-slate-200 flex space-x-2">
                        <button 
                            onClick={() => setActiveTab('analysis')}
                            className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            Analysis Report
                        </button>
                        <button 
                            onClick={() => setActiveTab('coverLetter')}
                            className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'coverLetter' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            AI Cover Letter Generator
                        </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div>
                        {activeTab === 'analysis' ? renderAnalysisContent() : renderCoverLetterContent()}
                    </div>
                 </div>
            )}

            {!isLoading && !analysisResult && !error && (
              <div className="flex flex-col justify-center items-center text-center h-96 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-8">
                 <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-500 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">Welcome to NaukriParse Pro</h2>
                 <p className="mt-2 text-slate-500 max-w-md">
                    Get an instant, AI-powered analysis of your resume against any job description. Fill in the details on the left to see your match score and get actionable feedback.
                 </p>
              </div>
            )}

          </div>

        </div>
      </main>
      <footer className="text-center py-4 mt-8 text-sm text-slate-500">
        Made By Sourish
      </footer>
    </div>
  );
};


// Icon Components
const FileIcon = () => (
    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.25l-.648-1.688a4.5 4.5 0 01-2.312-2.312L11.25 18l1.688-.648a4.5 4.5 0 012.312-2.312L16.25 14l.648 1.688a4.5 4.5 0 012.312 2.312L20.25 18l-1.688.648a4.5 4.5 0 01-2.312 2.312z" /></svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const ExclamationTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
);

const MagnifyingGlassIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);

const BoltIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
);

const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
);

const PencilSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
);


export default App;
