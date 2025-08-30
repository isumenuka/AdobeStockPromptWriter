import { Sparkles, Zap, LogIn, Shield } from 'lucide-react';
import { Cloud, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import UserMenu from './UserMenu';
import HistoryModal from './HistoryModal';
import StatsModal from './StatsModal';
import EmailAccessManager from './EmailAccessManager';
import SecurityDashboard from './SecurityDashboard';

const Header = () => {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showEmailManager, setShowEmailManager] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Adobe Stock Supporter
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">AI-Powered Professional Prompt Generator</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Powered by AI</span>
              </div>
              
              {user && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <Cloud className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Auto-Save Enabled</span>
                </div>
              )}
              
              {user && (
                <UserMenu 
                  onShowHistory={() => setShowHistoryModal(true)}
                  onShowStats={() => setShowStatsModal(true)}
                  onShowEmailManager={() => setShowEmailManager(true)}
                  onShowSecurity={() => setShowSecurityDashboard(true)}
                />
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 animate-slideIn">
              <div className="space-y-3">
                {/* AI Powered Badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Powered by AI</span>
                </div>
                
                {user && (
                  <>
                    {/* Auto-Save Badge */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <Cloud className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Auto-Save Enabled</span>
                    </div>
                    
                    {/* Mobile Menu Items */}
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowHistoryModal(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <div className="h-4 w-4 text-blue-600">📝</div>
                        </div>
                        <div>
                          <div className="font-medium">View History</div>
                          <div className="text-sm text-gray-500">See all generated prompts</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowStatsModal(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <div className="h-4 w-4 text-purple-600">📊</div>
                        </div>
                        <div>
                          <div className="font-medium">Statistics</div>
                          <div className="text-sm text-gray-500">View your activity stats</div>
                        </div>
                      </button>

                      {user?.email === 'isumenuka@gmail.com' && (
                        <>
                          <button
                            onClick={() => {
                              setShowEmailManager(true);
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Shield className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-medium">Manage Access</div>
                              <div className="text-sm text-gray-500">Control user permissions</div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setShowSecurityDashboard(true);
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <Shield className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium">Security Dashboard</div>
                              <div className="text-sm text-gray-500">Monitor security events</div>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {user && (
        <>
          <HistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
          />

          <StatsModal
            isOpen={showStatsModal}
            onClose={() => setShowStatsModal(false)}
          />

          {user?.email === 'isumenuka@gmail.com' && (
            <EmailAccessManager
              isOpen={showEmailManager}
              onClose={() => setShowEmailManager(false)}
            />
          )}

          {user?.email === 'isumenuka@gmail.com' && (
            <SecurityDashboard
              isOpen={showSecurityDashboard}
              onClose={() => setShowSecurityDashboard(false)}
            />
          )}
        </>
      )}
    </>
  );
};

export default Header;