import React from 'react';
import { Lock, Github, Mail, ExternalLink } from 'lucide-react';

interface AccessDeniedModalProps {
  isOpen: boolean;
  userEmail?: string;
}

const ownerContact = {
  github: 'https://github.com/isumenuka',
  email: 'isumenuka@gmail.com'
};

const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({ isOpen, userEmail }) => {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">This application requires special access permission</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-amber-900 mb-2">🔒 Private Access Required</h3>
            <p className="text-amber-800 text-sm">
              This Adobe Stock Supporter tool is currently in private access mode. 
              To use this application, you need to request access from the owner.
            </p>
          </div>

          {userEmail && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-red-900 mb-1">Access Denied</h4>
              <p className="text-red-800 text-sm">
                The email <strong>{userEmail}</strong> is not authorized to access this application.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">How to Get Access:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                <div>
                  <p className="text-sm text-gray-700">
                    Contact the owner through GitHub or email to request access
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                <div>
                  <p className="text-sm text-gray-700">
                    Provide your email address for access approval
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                <div>
                  <p className="text-sm text-gray-700">
                    Once approved, you can create an account and use all features
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Contact Owner:</h4>
            
            <div className="space-y-3">
              <a
                href={ownerContact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <Github className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">GitHub</div>
                  <div className="text-sm text-gray-300">@isumenuka</div>
                </div>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href={`mailto:${ownerContact.email}?subject=Adobe Stock Supporter - Access Request&body=Hi, I would like to request access to the Adobe Stock Supporter application. My email address is: [YOUR_EMAIL_HERE]`}
                className="flex items-center gap-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
              >
                <Mail className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">Email</div>
                  <div className="text-sm text-blue-200">{ownerContact.email}</div>
                </div>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Free Access Note */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="font-medium">Free Access Available</span>
            </div>
            <p className="text-green-700 text-sm">
              Access to this application is completely free. Just contact the owner to get your email approved!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedModal;