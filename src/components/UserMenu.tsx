import React, { useState } from 'react';
import { User, LogOut, History, BarChart3, Settings, Trash2, Shield } from 'lucide-react';
import { signOut, deleteAccount } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

interface UserMenuProps {
  onShowHistory: () => void;
  onShowStats: () => void;
  onShowEmailManager?: () => void;
  onShowSecurity?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowHistory, onShowStats, onShowEmailManager, onShowSecurity }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete your account and ALL your prompt history. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        alert(`Failed to delete account: ${error.message}`);
      } else {
        alert('Account deleted successfully. You will be signed out.');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert('An error occurred while deleting your account. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="text-left hidden lg:block">
          <div className="text-sm font-medium text-gray-900">
            {user.user_metadata?.first_name || user.email?.split('@')[0]}
          </div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 sm:w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
            <div className="p-3 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-900">
                {user.user_metadata?.first_name && user.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : user.email?.split('@')[0]}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onShowHistory();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <History className="h-4 w-4" />
                View History
              </button>

              <button
                onClick={() => {
                  onShowStats();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Statistics
              </button>

              {user?.email === 'isumenuka@gmail.com' && onShowEmailManager && (
                <button
                  onClick={() => {
                    onShowEmailManager();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Manage Access
                </button>
              )}

              {user?.email === 'isumenuka@gmail.com' && onShowSecurity && (
                <button
                  onClick={() => {
                    onShowSecurity();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Security Dashboard
                </button>
              )}

              <div className="border-t border-gray-200 my-1" />

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
          </div>
        </>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-red-800 mb-2">⚠️ Warning: This will permanently delete:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Your user account</li>
                  <li>• All generated prompts</li>
                  <li>• All prompt history</li>
                  <li>• All feedback data</li>
                  <li>• All statistics</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;