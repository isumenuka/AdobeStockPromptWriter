import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Mail, Shield, User, Calendar, Edit3, Check, X } from 'lucide-react';
import { 
  getAllowedEmails, 
  addAllowedEmail, 
  removeAllowedEmail, 
  revokeEmailAccess, 
  restoreEmailAccess,
  updateEmailNotes,
  type AllowedEmail 
} from '../services/emailAccess';

interface EmailAccessManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmailAccessManager: React.FC<EmailAccessManagerProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailNotes, setNewEmailNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEmails();
    }
  }, [isOpen]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const { emails: fetchedEmails, error } = await getAllowedEmails();
      if (error) {
        setError(error);
      } else {
        setEmails(fetchedEmails);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setAdding(true);
    setError('');
    try {
      const { success, error } = await addAllowedEmail(newEmail.trim(), newEmailNotes.trim() || undefined);
      
      if (success) {
        setSuccess(`Email "${newEmail}" added successfully!`);
        setNewEmail('');
        setNewEmailNotes('');
        await loadEmails();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(error || 'Failed to add email');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (!confirm(`Are you sure you want to permanently remove "${email}" from the allowed list?`)) {
      return;
    }

    try {
      const { success, error } = await removeAllowedEmail(email);
      
      if (success) {
        setSuccess(`Email "${email}" removed successfully!`);
        await loadEmails();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(error || 'Failed to remove email');
      }
    } catch (error) {
      setError('Failed to remove email');
    }
  };

  const handleToggleStatus = async (email: string, currentStatus: string) => {
    try {
      const { success, error } = currentStatus === 'active' 
        ? await revokeEmailAccess(email)
        : await restoreEmailAccess(email);
      
      if (success) {
        setSuccess(`Email "${email}" ${currentStatus === 'active' ? 'revoked' : 'restored'} successfully!`);
        await loadEmails();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(error || 'Failed to update status');
      }
    } catch (error) {
      setError('Failed to update status');
    }
  };

  const handleUpdateNotes = async (email: string) => {
    try {
      const { success, error } = await updateEmailNotes(email, editNotesValue);
      
      if (success) {
        setSuccess('Notes updated successfully!');
        setEditingNotes(null);
        setEditNotesValue('');
        await loadEmails();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(error || 'Failed to update notes');
      }
    } catch (error) {
      setError('Failed to update notes');
    }
  };

  const startEditingNotes = (email: string, currentNotes?: string) => {
    setEditingNotes(email);
    setEditNotesValue(currentNotes || '');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setEditNotesValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email Access Management</h2>
              <p className="text-sm text-gray-600">Manage who can access your application</p>
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
        <div className="p-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✅ {success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Add New Email */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Email Access
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={newEmailNotes}
                  onChange={(e) => setNewEmailNotes(e.target.value)}
                  placeholder="e.g., Client, Partner, Team member..."
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleAddEmail}
                disabled={adding || !newEmail.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding Email...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Email Access
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Email List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Allowed Emails ({emails.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No emails in the allowed list yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {emails.map((emailRecord) => (
                  <div key={emailRecord.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            emailRecord.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {emailRecord.email}
                              {emailRecord.email === 'isumenuka@gmail.com' && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                  OWNER
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                emailRecord.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {emailRecord.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Added {new Date(emailRecord.created_at).toLocaleDateString()}
                            </div>
                            
                            {/* Notes Section */}
                            <div className="mt-2">
                              {editingNotes === emailRecord.email ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editNotesValue}
                                    onChange={(e) => setEditNotesValue(e.target.value)}
                                    placeholder="Add notes..."
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <button
                                    onClick={() => handleUpdateNotes(emailRecord.email)}
                                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditingNotes}
                                    className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    {emailRecord.notes || 'No notes'}
                                  </span>
                                  <button
                                    onClick={() => startEditingNotes(emailRecord.email, emailRecord.notes)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {emailRecord.email !== 'isumenuka@gmail.com' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(emailRecord.email, emailRecord.status)}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                              emailRecord.status === 'active'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {emailRecord.status === 'active' ? (
                              <>
                                <EyeOff className="h-3 w-3 inline mr-1" />
                                Revoke
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 inline mr-1" />
                                Restore
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleRemoveEmail(emailRecord.email)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Permanently delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4">
            <h4 className="font-semibold text-amber-900 mb-2">💡 How It Works</h4>
            <div className="text-sm text-amber-800 space-y-1">
              <p>• <strong>Active</strong> emails can create accounts and access the application</p>
              <p>• <strong>Revoked</strong> emails can't access but data is preserved</p>
              <p>• <strong>Removed</strong> emails are permanently deleted</p>
              <p>• Your owner email cannot be removed or revoked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAccessManager;