import React from 'react';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = (s: number) => {
    if (s >= 85) return 'stroke-emerald-500';
    if (s >= 60) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const getTextColor = (s: number) => {
    if (s >= 85) return 'text-emerald-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="relative flex items-center justify-center w-40 h-40 md:w-48 md:h-48">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="stroke-slate-200"
          strokeWidth="10"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={`transition-all duration-1000 ease-out ${getStrokeColor(score)}`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl md:text-4xl font-bold ${getTextColor(score)}`}>
          {score}
        </span>
        <span className="text-sm font-medium text-slate-500">Match Score</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
