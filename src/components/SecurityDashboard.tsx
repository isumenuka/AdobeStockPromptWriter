import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Eye, Trash2, RefreshCw } from 'lucide-react';
import { SecurityLogger } from '../utils/securityMiddleware';
import { EnvironmentSecurity } from '../utils/securityUtils';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ isOpen, onClose }) => {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [environmentCheck, setEnvironmentCheck] = useState<{ isSecure: boolean; warnings: string[] }>({ isSecure: true, warnings: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSecurityData();
    }
  }, [isOpen]);

  const loadSecurityData = () => {
    setLoading(true);
    try {
      // Get security events
      const events = SecurityLogger.getEvents();
      setSecurityEvents(events);
      
      // Check environment security
      const envCheck = EnvironmentSecurity.checkEnvironment();
      setEnvironmentCheck(envCheck);
    } finally {
      setLoading(false);
    }
  };

  const handleClearEvents = () => {
    if (confirm('Are you sure you want to clear all security events?')) {
      SecurityLogger.clearEvents();
      setSecurityEvents([]);
    }
  };

  const getEventTypeColor = (type: string) => {
    if (type.includes('error') || type.includes('denied')) {
      return 'text-red-600 bg-red-50';
    }
    if (type.includes('success')) {
      return 'text-green-600 bg-green-50';
    }
    if (type.includes('attempt')) {
      return 'text-blue-600 bg-blue-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Security Dashboard</h2>
              <p className="text-sm text-gray-600">Monitor security events and system status</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadSecurityData}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading security data...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Environment Security Status */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {environmentCheck.isSecure ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  Environment Security Status
                </h3>
                
                {environmentCheck.isSecure ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✅ Environment is secure</p>
                    <p className="text-green-700 text-sm mt-1">All security checks passed</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">⚠️ Security warnings detected</p>
                    </div>
                    {environmentCheck.warnings.map((warning, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">• {warning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Events */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Security Events</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{securityEvents.length} events</span>
                    {securityEvents.length > 0 && (
                      <button
                        onClick={handleClearEvents}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Clear all events"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No security events recorded yet
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {securityEvents.slice().reverse().map((event, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {event.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          <div className="font-medium mb-1">Details:</div>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          <div>URL: {event.url}</div>
                          <div>User Agent: {event.userAgent.substring(0, 100)}...</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Recommendations */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">🔒 Security Recommendations</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Content Security Policy (CSP) is active</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Input validation and sanitization enabled</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Rate limiting protection active</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure session management implemented</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>XSS protection measures active</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>File upload security validation enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;