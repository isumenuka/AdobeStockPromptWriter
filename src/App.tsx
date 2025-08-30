import React, { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { isEmailAllowed } from './services/emailAccess';
import { useAutoSave } from './hooks/useAutoSave';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS } from './config/constants';
import { autoSaveCSVProject } from './services/autoSave';
import { 
  saveTexturePrompt,
  saveAbstractWavePrompt,
  saveSkyPrompt,
  saveWhiteFramePrompt,
  saveCustomPrompt
} from './services/generatorPrompts';
import type { CSVRow } from './types';
import Header from './components/Header';
import CustomPromptGenerator from './components/CustomPromptGenerator';
import PromptGenerator from './components/PromptGenerator';
import AbstractWaveGenerator from './components/AbstractWaveGenerator';
import SkyGenerator from './components/SkyGenerator';
import WhiteFrameGenerator from './components/WhiteFrameGenerator';
import GradientFlowGenerator from './components/GradientFlowGenerator';
import GeneratorSelector from './components/GeneratorSelector';
import AdobeStockExport from './components/AdobeStockExport';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import Footer from './components/Footer';
import AccessDeniedModal from './components/AccessDeniedModal';
import AuthModal from './components/AuthModal';

function App() {
  const { user, loading } = useAuth();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedGenerator, setSelectedGenerator] = useLocalStorage<'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'gradientflow'>(
    STORAGE_KEYS.GENERATOR_TYPE,
    'texture'
  );
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | 'offline'>('offline');
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [autoSaveError, setAutoSaveError] = useState<string | undefined>();
  
  // Get all prompt histories for auto-saving
  const [textureHistory] = useLocalStorage<GeneratedPrompt[]>(STORAGE_KEYS.GENERATED_PROMPT_HISTORY, []);
  const [abstractWaveHistory] = useLocalStorage<GeneratedAbstractWavePrompt[]>(STORAGE_KEYS.ABSTRACTWAVE_PROMPT_HISTORY, []);
  const [skyHistory] = useLocalStorage<GeneratedSkyPrompt[]>(STORAGE_KEYS.SKY_PROMPT_HISTORY, []);
  const [whiteFrameHistory] = useLocalStorage<GeneratedWhiteFramePrompt[]>(STORAGE_KEYS.WHITEFRAME_PROMPT_HISTORY, []);
  const [customHistory] = useLocalStorage<CustomPrompt[]>(STORAGE_KEYS.CUSTOM_PROMPT_HISTORY, []);

  // Auto-save CSV data to cloud
  useAutoSave(
    csvData,
    async () => {
      if (!user || csvData.length === 0) {
        return { success: true };
      }
      
      const result = await autoSaveCSVProject(csvData, currentProjectId);
      if (result.success && result.projectId && !currentProjectId) {
        setCurrentProjectId(result.projectId);
      }
      return result;
    },
    {
      onSave: async () => {
        setAutoSaveStatus('saving');
      },
      onSuccess: () => {
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        setAutoSaveError(undefined);
      },
      onError: (error) => {
        setAutoSaveStatus('error');
        setAutoSaveError(error);
      }
    }
  );

  // Update auto-save status based on user authentication
  useEffect(() => {
    if (!user) {
      setAutoSaveStatus('offline');
    } else if (autoSaveStatus === 'offline') {
      setAutoSaveStatus('saved');
    }
  }, [user, autoSaveStatus]);
  // Handle authentication and access control
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user signed in - show auth modal
        setShowAuthModal(true);
        setShowAccessDenied(false);
      } else if (!isEmailAllowed(user.email || '')) {
        // User signed in but not authorized - show access denied
        setShowAuthModal(false);
        setShowAccessDenied(true);
      } else {
        // User signed in and authorized - hide all modals
        setShowAuthModal(false);
        setShowAccessDenied(false);
      }
    }
  }, [user, loading]);

  const handleAddCsvEntry = async (entry: Omit<CSVRow, 'id'>) => {
    // Check for duplicate titles
    const isDuplicateTitle = csvData.some(row => 
      row.title.toLowerCase().trim() === entry.title.toLowerCase().trim()
    );
    
    if (isDuplicateTitle) {
      alert('A row with this title already exists in the CSV export. Please use a different title.');
      return;
    }

    const newEntry: CSVRow = {
      ...entry,
      id: `${Date.now()}-${Math.random()}`
    };
    setCsvData(prev => [...prev, newEntry]);
  };

  // Enhanced prompt saving function that saves to both local storage and database
  const handlePromptGenerated = async (promptType: 'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'gradientflow' | 'custom', promptData: any) => {
    // Save to database if user is authenticated
    if (user) {
      try {
        switch (promptType) {
          case 'texture':
            await saveTexturePrompt(promptData);
            break;
          case 'abstractwave':
            await saveAbstractWavePrompt(promptData);
            break;
          case 'sky':
            await saveSkyPrompt(promptData);
            break;
          case 'whiteframe':
            await saveWhiteFramePrompt(promptData);
            break;
          case 'gradientflow':
            // Note: Add saveGradientFlowPrompt to services/generatorPrompts.ts when database table is ready
            console.log('GradientFlow prompt generated:', promptData);
            break;
          case 'custom':
            await saveCustomPrompt(promptData);
            break;
        }
      } catch (error) {
        console.error('Failed to save prompt to database:', error);
      }
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show main app if user is authenticated and authorized
  if (!user || !isEmailAllowed(user.email || '')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
        <Header />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {}} // Prevent closing - force authentication
          onSuccess={() => setShowAuthModal(false)}
        />
        <AccessDeniedModal 
          isOpen={showAccessDenied}
          userEmail={user?.email || undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Generator Selector - Full Width */}
          <div className="mb-8">
            <GeneratorSelector 
              selectedGenerator={selectedGenerator}
              onGeneratorChange={setSelectedGenerator}
            />
          </div>
          
          {/* Split Layout - Generators Left, CSV Export Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Side - Generators */}
            <div className="space-y-6 lg:space-y-8">
              <CustomPromptGenerator onAddCsvEntry={handleAddCsvEntry} />
              
              {selectedGenerator === 'texture' ? (
                <PromptGenerator onAddCsvEntry={handleAddCsvEntry} onPromptGenerated={handlePromptGenerated} />
              ) : selectedGenerator === 'abstractwave' ? (
                <AbstractWaveGenerator onAddCsvEntry={handleAddCsvEntry} onPromptGenerated={handlePromptGenerated} />
              ) : selectedGenerator === 'gradientflow' ? (
                <GradientFlowGenerator onAddCsvEntry={handleAddCsvEntry} onPromptGenerated={handlePromptGenerated} />
              ) : selectedGenerator === 'whiteframe' ? (
                <WhiteFrameGenerator onAddCsvEntry={handleAddCsvEntry} onPromptGenerated={handlePromptGenerated} />
              ) : (
                <SkyGenerator onAddCsvEntry={handleAddCsvEntry} onPromptGenerated={handlePromptGenerated} />
              )}
            </div>
            
            {/* Right Side - CSV Export */}
            <div className="lg:sticky lg:top-8 lg:h-fit">
              {/* Auto-Save Status */}
              {user && (
                <div className="mb-4">
                  <AutoSaveIndicator 
                    status={autoSaveStatus}
                    lastSaved={lastSaved}
                    error={autoSaveError}
                  />
                </div>
              )}
              
              <AdobeStockExport 
                csvData={csvData}
                setCsvData={setCsvData}
                currentProjectId={currentProjectId}
                setCurrentProjectId={setCurrentProjectId}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;