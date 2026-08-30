import React from 'react';

interface BadgeProps {
  type: 'verified' | 'unverified' | 'missing' | 'disqualified' | 'passed' | 'critical' | 'high' | 'medium' | 'low' | 'kill-criteria';
  text?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, text, className = '' }) => {
  switch (type) {
    case 'verified':
      return (
        <span className={`inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${className}`}>
          <span className="material-symbols-outlined text-[13px] fill text-emerald-600">check_circle</span>
          {text || 'Source Verified'}
        </span>
      );
    case 'unverified':
      return (
        <span className={`inline-flex items-center gap-1 bg-amber-500/15 text-amber-800 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${className}`}>
          <span className="material-symbols-outlined text-[13px] text-amber-700">warning</span>
          {text || 'Review Source'}
        </span>
      );
    case 'missing':
      return (
        <span className={`inline-flex items-center gap-1 bg-error-container/30 text-error border border-error/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${className}`}>
          <span className="material-symbols-outlined text-[13px] text-error">cancel</span>
          {text || 'Not Found in Document'}
        </span>
      );
    case 'disqualified':
      return (
        <span className={`inline-flex items-center gap-1 bg-error text-white px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm animate-pulse ${className}`}>
          <span className="material-symbols-outlined text-[14px]">block</span>
          {text || 'DISQUALIFIED'}
        </span>
      );
    case 'kill-criteria':
      return (
        <span className={`inline-flex items-center gap-1 bg-error/10 text-error border border-error/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${className}`}>
          <span className="material-symbols-outlined text-[13px]">security</span>
          {text || 'MANDATORY GATE'}
        </span>
      );
    case 'critical':
      return (
        <span className={`inline-flex items-center gap-1 bg-error-container text-on-error-container border border-error/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${className}`}>
          <span className="material-symbols-outlined text-[13px]">gavel</span>
          {text || 'CRITICAL'}
        </span>
      );
    case 'high':
      return (
        <span className={`inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${className}`}>
          <span className="material-symbols-outlined text-[13px]">warning</span>
          {text || 'HIGH RISK'}
        </span>
      );
    case 'medium':
      return (
        <span className={`inline-flex items-center gap-1 bg-blue-500/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[11px] font-medium ${className}`}>
          {text || 'MEDIUM'}
        </span>
      );
    case 'passed':
      return (
        <span className={`inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-semibold ${className}`}>
          <span className="material-symbols-outlined text-[13px] text-emerald-600">check</span>
          {text || 'PASS'}
        </span>
      );
    default:
      return null;
  }
};
