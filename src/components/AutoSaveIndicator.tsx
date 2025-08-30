import React from 'react';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'offline';
  lastSaved?: Date;
  error?: string;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status, lastSaved, error }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          iconClassName: 'animate-spin'
        };
      case 'saved':
        return {
          icon: Check,
          text: lastSaved ? `Saved ${getTimeAgo(lastSaved)}` : 'Saved',
          className: 'text-green-600 bg-green-50 border-green-200',
          iconClassName: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: error || 'Save failed',
          className: 'text-red-600 bg-red-50 border-red-200',
          iconClassName: ''
        };
      case 'offline':
        return {
          icon: CloudOff,
          text: 'Offline',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          iconClassName: ''
        };
      default:
        return {
          icon: Cloud,
          text: 'Auto-save enabled',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          iconClassName: ''
        };
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 10) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    return `at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all ${config.className} shadow-sm`}>
      <Icon className={`h-4 w-4 ${config.iconClassName}`} />
      <span className="hidden sm:inline">{config.text}</span>
      <span className="sm:hidden">
        {status === 'saving' ? 'Saving...' : 
         status === 'saved' ? 'Saved' : 
         status === 'error' ? 'Error' : 'Offline'}
      </span>
    </div>
  );
};

export default AutoSaveIndicator;