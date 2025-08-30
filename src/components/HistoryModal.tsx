import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Download, Trash2, Copy, Check } from 'lucide-react';
import { 
  getTexturePrompts,
  getAbstractWavePrompts,
  getSkyPrompts,
  getWhiteFramePrompts,
  getCustomPrompts,
  deletePrompt
} from '../services/generatorPrompts';
import { copyToClipboard } from '../utils/clipboard';
import type { 
  TexturePromptDB,
  AbstractWavePromptDB,
  SkyPromptDB,
  WhiteFramePromptDB,
  CustomPromptDB
} from '../services/generatorPrompts';

type AllPromptTypes = TexturePromptDB | AbstractWavePromptDB | SkyPromptDB | WhiteFramePromptDB | CustomPromptDB;

interface UnifiedPrompt {
  id: string;
  type: 'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'custom';
  prompt_text: string;
  title?: string;
  keywords?: string[];
  user_feedback?: 'like' | 'dislike' | 'neutral';
  created_at: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [prompts, setPrompts] = useState<UnifiedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFeedback, setFilterFeedback] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      // Load from all generator tables with error handling
      const results = await Promise.allSettled([
        getTexturePrompts(),
        getAbstractWavePrompts(),
        getSkyPrompts(),
        getWhiteFramePrompts(),
        getCustomPrompts()
      ]);

      // Extract successful results
      const [textureResult, abstractwaveResult, skyResult, whiteframeResult, customResult] = results.map(result => 
        result.status === 'fulfilled' ? result.value : { prompts: [], error: 'Query failed' }
      );

      // Combine all prompts into unified format
      const allPrompts: UnifiedPrompt[] = [
        ...(textureResult.prompts || []).map(p => ({
          id: p.id,
          type: 'texture' as const,
          prompt_text: p.prompt_text,
          title: p.title,
          keywords: p.keywords,
          user_feedback: p.user_feedback,
          created_at: p.created_at
        })),
        ...(abstractwaveResult.prompts || []).map(p => ({
          id: p.id,
          type: 'abstractwave' as const,
          prompt_text: p.prompt_text,
          title: p.title,
          keywords: p.keywords,
          user_feedback: p.user_feedback,
          created_at: p.created_at
        })),
        ...(skyResult.prompts || []).map(p => ({
          id: p.id,
          type: 'sky' as const,
          prompt_text: p.prompt_text,
          title: p.title,
          keywords: p.keywords,
          user_feedback: p.user_feedback,
          created_at: p.created_at
        })),
        ...(whiteframeResult.prompts || []).map(p => ({
          id: p.id,
          type: 'whiteframe' as const,
          prompt_text: p.prompt_text,
          title: p.title,
          keywords: p.keywords,
          user_feedback: p.user_feedback,
          created_at: p.created_at
        })),
        ...(customResult.prompts || []).map(p => ({
          id: p.id,
          type: 'custom' as const,
          prompt_text: p.prompt_text,
          title: p.title,
          keywords: p.keywords,
          user_feedback: p.user_feedback,
          created_at: p.created_at
        }))
      ];

      // Sort by creation date (newest first)
      allPrompts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPrompts(allPrompts);
      
      // Log any errors from individual queries
      const queryErrors = [textureResult.error, abstractwaveResult.error, skyResult.error, whiteframeResult.error, customResult.error].filter(Boolean);
      if (queryErrors.length > 0) {
        console.warn('Some queries failed:', queryErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const { success, error } = await deletePrompt(promptId, prompt.type);
    if (success) {
      setPrompts(prev => prev.filter(p => p.id !== promptId));
    } else {
      alert(`Failed to delete prompt: ${error}`);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Title', 'Keywords', 'Feedback', 'Prompt'].join(','),
      ...filteredPrompts.map(prompt => [
        new Date(prompt.created_at).toLocaleDateString(),
        prompt.type,
        `"${prompt.title || ''}"`,
        `"${prompt.keywords?.join(', ') || ''}"`,
        prompt.user_feedback || '',
        `"${prompt.prompt_text}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchTerm || 
      prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || prompt.type === filterType;
    const matchesFeedback = filterFeedback === 'all' || prompt.user_feedback === filterFeedback;

    return matchesSearch && matchesType && matchesFeedback;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'texture': return 'bg-amber-100 text-amber-800';
      case 'abstractwave': return 'bg-blue-100 text-blue-800';
      case 'sky': return 'bg-sky-100 text-sky-800';
      case 'whiteframe': return 'bg-gray-100 text-gray-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackIcon = (feedback?: string) => {
    switch (feedback) {
      case 'like': return '👍';
      case 'dislike': return '👎';
      case 'neutral': return '😐';
      default: return '❓';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col modal-mobile">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Prompt History</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {filteredPrompts.length} of {prompts.length} prompts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredPrompts.length === 0}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredPrompts.length === 0}
              className="sm:hidden p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export CSV"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prompts, titles, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="texture">Texture</option>
                <option value="abstractwave">AbstractWave</option>
                <option value="sky">Sky</option>
                <option value="whiteframe">White Frame</option>
                <option value="custom">Custom</option>
              </select>

              {/* Feedback Filter */}
              <select
                value={filterFeedback}
                onChange={(e) => setFilterFeedback(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Feedback</option>
                <option value="like">👍 Liked</option>
                <option value="dislike">👎 Disliked</option>
                <option value="neutral">😐 Neutral</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading your prompt history...</div>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">📝</div>
                <div className="text-gray-500">
                  {prompts.length === 0 ? 'No prompts generated yet' : 'No prompts match your filters'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredPrompts.map((prompt) => (
                <div key={prompt.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(prompt.type)}`}>
                        {prompt.type}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        <span className="hidden sm:inline">
                          {new Date(prompt.created_at).toLocaleDateString()} at{' '}
                          {new Date(prompt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="sm:hidden">
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </span>
                      </span>
                      <span className="text-base sm:text-lg">
                        {getFeedbackIcon(prompt.user_feedback)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(prompt.prompt_text, prompt.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 sm:p-0"
                        title="Copy prompt"
                      >
                        {copiedId === prompt.id ? (
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 sm:p-0"
                        title="Delete prompt"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>

                  {prompt.title && (
                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{prompt.title}</h3>
                    </div>
                  )}

                  {prompt.keywords && prompt.keywords.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {prompt.keywords.slice(0, window.innerWidth < 640 ? 5 : 10).map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                          >
                            {keyword}
                          </span>
                        ))}
                        {prompt.keywords.length > (window.innerWidth < 640 ? 5 : 10) && (
                          <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-500">
                            +{prompt.keywords.length - (window.innerWidth < 640 ? 5 : 10)} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-700 break-words leading-relaxed">{prompt.prompt_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;