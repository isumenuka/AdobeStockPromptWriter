import React from 'react';
import { Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AutoSaveSettings: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="font-medium text-amber-900">Auto-Save Unavailable</h3>
            <p className="text-sm text-amber-700">Sign in to enable automatic cloud saving</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100">
          <Cloud className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Auto-Save Enabled</h3>
          <p className="text-sm text-gray-600">
            Your work is automatically saved to the cloud
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoSaveSettings;