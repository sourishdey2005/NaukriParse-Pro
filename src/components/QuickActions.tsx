import React from 'react';

interface QuickActionsProps {
  onTailorResume: () => void;
  onPrepareInterview: () => void;
  onDraftPost: () => void;
  isLoading: {
    tailor: boolean;
    interview: boolean;
    post: boolean;
  };
}

const QuickActions: React.FC<QuickActionsProps> = ({ onTailorResume, onPrepareInterview, onDraftPost, isLoading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 animate-fade-in">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Next Steps: Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionButton 
          title="Tailor My Resume"
          description="Generate a revised resume with AI-powered improvements."
          icon={<PencilSquareIcon />}
          onClick={onTailorResume}
          isLoading={isLoading.tailor}
        />
        <ActionButton 
          title="Prepare for Interview"
          description="Get potential interview questions and sample answers."
          icon={<ChatBubbleLeftRightIcon />}
          onClick={onPrepareInterview}
          isLoading={isLoading.interview}
        />
        <ActionButton 
          title="Draft LinkedIn Post"
          description="Create a professional post about applying for this role."
          icon={<ShareIcon />}
          onClick={onDraftPost}
          isLoading={isLoading.post}
        />
      </div>
    </div>
  );
};

interface ActionButtonProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    isLoading: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, description, icon, onClick, isLoading }) => (
    <button 
      onClick={onClick}
      disabled={isLoading}
      className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 p-4 rounded-lg text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
    >
        <div className="flex items-center">
            <div className="w-8 h-8 text-indigo-600 mr-3">{icon}</div>
            <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700">{title}</h4>
        </div>
        <p className="text-xs text-slate-500 mt-2">{description}</p>
        {isLoading && <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-1 bg-indigo-500 w-1/2 animate-pulse"></div>
        </div>}
    </button>
);


const PencilSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
);
const ChatBubbleLeftRightIcon = () => (
    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.06c-.278.008-.55.057-.81.143l-4.096 1.637a.75.75 0 01-1.016-.629V19.875c0-.663-.538-1.2-1.2-1.2H6.382a2.25 2.25 0 01-2.25-2.25v-4.286c0-.97.616-1.813 1.5-2.097m6.522 6.908l2.67-1.068a.75.75 0 00.55-.684V9.25a.75.75 0 00-.55-.684l-2.67-1.068a.75.75 0 00-.696 0l-2.67 1.068a.75.75 0 00-.55.684v3.956a.75.75 0 00.55.684l2.67 1.068a.75.75 0 00.696 0z" /></svg>
);
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.044.586.06.336.031.674.053 1.018.065m-1.604-1.528c.305-.182.624-.345.956-.492a23.848 23.848 0 015.482-1.554M12 21a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm0-4.5c.195-.025.39-.044.586-.06.336-.031.674-.053 1.018-.065m-1.604 1.528c.305.182.624.345.956.492a23.848 23.848 0 005.482 1.554M4.5 12a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm0-4.5c.195.025.39.044.586.06.336.031.674.053 1.018.065m-1.604-1.528c.305-.182.624-.345.956-.492a23.848 23.848 0 015.482-1.554" /></svg>
);

export default QuickActions;