import React, { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Target, Calendar } from 'lucide-react';
import { getUserGeneratorStats } from '../services/generatorPrompts';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Stats {
  totalPrompts: number;
  promptsByType: Record<string, number>;
  feedbackStats: Record<string, number>;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<Stats>({
    totalPrompts: 0,
    promptsByType: {},
    feedbackStats: {}
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await getUserGeneratorStats();
      if (result.error) {
        console.error('Error loading stats:', result.error);
        // Still show partial data if available
        setStats({
          totalPrompts: result.totalPrompts || 0,
          promptsByType: result.promptsByType || {},
          feedbackStats: result.feedbackStats || {}
        });
      } else {
        setStats({
          totalPrompts: result.totalPrompts,
          promptsByType: result.promptsByType,
          feedbackStats: result.feedbackStats
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'texture': return 'bg-amber-500';
      case 'abstractwave': return 'bg-blue-500';
      case 'sky': return 'bg-sky-500';
      case 'whiteframe': return 'bg-gray-500';
      case 'custom': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getFeedbackColor = (feedback: string) => {
    switch (feedback) {
      case 'like': return 'bg-green-500';
      case 'dislike': return 'bg-red-500';
      case 'neutral': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getFeedbackIcon = (feedback: string) => {
    switch (feedback) {
      case 'like': return '👍';
      case 'dislike': return '👎';
      case 'neutral': return '😐';
      default: return '❓';
    }
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto modal-mobile">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Statistics</h2>
              <p className="text-xs sm:text-sm text-gray-600">Insights into your prompt generation activity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading your statistics...</div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-blue-900">{stats.totalPrompts}</div>
                      <div className="text-xs sm:text-sm text-blue-700">Total Prompts</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-green-900">
                        {stats.feedbackStats.like || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-green-700">Liked Prompts</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-purple-900">
                        {Object.keys(stats.promptsByType).length}
                      </div>
                      <div className="text-xs sm:text-sm text-purple-700">Generator Types Used</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompts by Type */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prompts by Generator Type</h3>
                {Object.keys(stats.promptsByType).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.promptsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-700 capitalize">
                          {type}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                          <div
                            className={`h-3 rounded-full ${getTypeColor(type)}`}
                            style={{
                              width: `${calculatePercentage(count, stats.totalPrompts)}%`
                            }}
                          />
                        </div>
                        <div className="w-16 text-sm text-gray-600 text-right">
                          {count} ({calculatePercentage(count, stats.totalPrompts)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No prompts generated yet
                  </div>
                )}
              </div>

              {/* Feedback Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Distribution</h3>
                {Object.keys(stats.feedbackStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.feedbackStats).map(([feedback, count]) => (
                      <div key={feedback} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span>{getFeedbackIcon(feedback)}</span>
                          <span className="capitalize">{feedback}</span>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                          <div
                            className={`h-3 rounded-full ${getFeedbackColor(feedback)}`}
                            style={{
                              width: `${calculatePercentage(count, stats.totalPrompts)}%`
                            }}
                          />
                        </div>
                        <div className="w-16 text-sm text-gray-600 text-right">
                          {count} ({calculatePercentage(count, stats.totalPrompts)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No feedback provided yet
                  </div>
                )}
              </div>

              {/* Insights */}
              {stats.totalPrompts > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-6">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">💡 Insights</h3>
                  <div className="space-y-2 text-sm text-amber-800">
                    <div>
                      • You've generated <strong>{stats.totalPrompts}</strong> prompts total
                    </div>
                    {stats.feedbackStats.like > 0 && (
                      <div>
                        • <strong>{calculatePercentage(stats.feedbackStats.like, stats.totalPrompts)}%</strong> of your prompts were liked
                      </div>
                    )}
                    {Object.keys(stats.promptsByType).length > 0 && (
                      <div>
                        • Your most used generator is <strong>{Object.entries(stats.promptsByType).sort(([,a], [,b]) => b - a)[0][0]}</strong>
                      </div>
                    )}
                    <div>
                      • Keep providing feedback to help the AI learn your preferences!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;