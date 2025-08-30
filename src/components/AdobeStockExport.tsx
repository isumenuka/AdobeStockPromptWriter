import React, { useRef } from 'react';
import { Download, X, Plus, Upload, Image } from 'lucide-react';
import { validateFilename, validateKeywords, validateFileUpload, detectXSS } from '../utils/inputValidation';
import CSVProjectManager from './CSVProjectManager';
import AutoSaveSettings from './AutoSaveSettings';
import type { CSVRow } from '../types';
import { useAuth } from '../hooks/useAuth';

interface AdobeStockExportProps {
  csvData: CSVRow[];
  setCsvData: React.Dispatch<React.SetStateAction<CSVRow[]>>;
  currentProjectId?: string;
  setCurrentProjectId?: (id: string | undefined) => void;
}

// Validation functions
const validateRow = (row: CSVRow): string[] => {
  const errors: string[] = [];
  
  // Validate filename
  const filenameValidation = validateFilename(row.filename);
  if (!filenameValidation.isValid) {
    errors.push(filenameValidation.error || 'Invalid filename');
  }
  
  if (!row.title.trim()) {
    errors.push('Title is required');
  } else if (row.title.length < 10) {
    errors.push('Title must be at least 10 characters');
  } else if (row.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }
  
  // Validate keywords
  const keywordsValidation = validateKeywords(row.keywords);
  if (!keywordsValidation.isValid) {
    errors.push(keywordsValidation.error || 'Invalid keywords');
  }
  
  // Check for XSS in title and keywords
  if (detectXSS(row.title)) {
    errors.push('Title contains potentially dangerous content');
  }
  
  if (detectXSS(row.keywords)) {
    errors.push('Keywords contain potentially dangerous content');
  }
  
  return errors;
};

const checkForDuplicates = (csvData: CSVRow[]): { duplicateFilenames: string[], duplicateTitles: string[] } => {
  const filenameCount: { [key: string]: number } = {};
  const titleCount: { [key: string]: number } = {};
  
  csvData.forEach(row => {
    if (row.filename.trim()) {
      const filename = row.filename.toLowerCase().trim();
      filenameCount[filename] = (filenameCount[filename] || 0) + 1;
    }
    if (row.title.trim()) {
      const title = row.title.toLowerCase().trim();
      titleCount[title] = (titleCount[title] || 0) + 1;
    }
  });
  
  return {
    duplicateFilenames: Object.keys(filenameCount).filter(key => filenameCount[key] > 1),
    duplicateTitles: Object.keys(titleCount).filter(key => titleCount[key] > 1)
  };
};

const AdobeStockExport: React.FC<AdobeStockExportProps> = ({ 
  csvData, 
  setCsvData, 
  currentProjectId, 
  setCurrentProjectId 
}) => {
  const { user } = useAuth();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const handleAddCsvEntry = async (entry: Omit<CSVRow, 'id'>) => {
    // Check for duplicate titles
    const isDuplicateTitle = csvData.some(row => 
      row.title.toLowerCase().trim() === entry.title.toLowerCase().trim()
    );
    
    if (isDuplicateTitle) {
      return;
    }

    const newEntry: CSVRow = {
      ...entry,
      id: `${Date.now()}-${Math.random()}`
    };
    setCsvData(prev => [...prev, newEntry]);
  };
  
  const handleImageUploadForRow = (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file upload security
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.isValid) {
      alert(`File upload error: ${fileValidation.error}`);
      return;
    }

    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    
    // Extract filename with extension
    const filename = file.name;
    
    // Update the specific row
    setCsvData(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, filename, imageUrl }
        : row
    ));
  };

  const handleAddManualRow = () => {
    const newRow: CSVRow = {
      id: `${Date.now()}-${Math.random()}`,
      filename: '',
      title: '',
      keywords: '',
      category: '8',
      releases: '',
      imageUrl: undefined
    };
    setCsvData(prev => [...prev, newRow]);
  };

  const handleRowChange = (id: string, field: keyof CSVRow, value: string) => {
    // Check for duplicate filename
    if (field === 'filename' && value.trim()) {
      const isDuplicateFilename = csvData.some(row => 
        row.id !== id && row.filename.toLowerCase().trim() === value.toLowerCase().trim()
      );
      if (isDuplicateFilename) {
        return;
      }
    }
    
    // Check for duplicate title
    if (field === 'title' && value.trim()) {
      const isDuplicateTitle = csvData.some(row => 
        row.id !== id && row.title.toLowerCase().trim() === value.toLowerCase().trim()
      );
      if (isDuplicateTitle) {
        return;
      }
    }
    
    setCsvData(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleRemoveRow = (id: string) => {
    setCsvData(prev => {
      const rowToRemove = prev.find(row => row.id === id);
      if (rowToRemove?.imageUrl) {
        URL.revokeObjectURL(rowToRemove.imageUrl);
      }
      return prev.filter(row => row.id !== id);
    });
  };

  const handleExportCSV = () => {
    if (csvData.length === 0) {
      return;
    }

    // Validate all rows before export
    const validationErrors: { [key: string]: string[] } = {};
    let hasErrors = false;
    
    csvData.forEach((row, index) => {
      const errors = validateRow(row);
      if (errors.length > 0) {
        validationErrors[`Row ${index + 1}`] = errors;
        hasErrors = true;
      }
    });
    
    // Check for duplicates
    const { duplicateFilenames, duplicateTitles } = checkForDuplicates(csvData);
    
    if (duplicateFilenames.length > 0 || duplicateTitles.length > 0) {
      hasErrors = true;
      if (duplicateFilenames.length > 0) {
        validationErrors['Duplicate Filenames'] = duplicateFilenames;
      }
      if (duplicateTitles.length > 0) {
        validationErrors['Duplicate Titles'] = duplicateTitles;
      }
    }
    
    if (hasErrors) {
      return;
    }
    const headers = ['Filename', 'Title', 'Keywords', 'Category', 'Releases'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => [
        `"${row.filename}"`,
        `"${row.title}"`,
        `"${row.keywords}"`,
        `"${row.category}"`,
        `"${row.releases}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `adobe_stock_metadata_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    // Clean up object URLs
    csvData.forEach(row => {
      if (row.imageUrl) {
        URL.revokeObjectURL(row.imageUrl);
      }
    });
    setCsvData([]);
    setShowClearConfirm(false);
  };

  // Get validation status for each row
  const getRowValidation = (row: CSVRow) => {
    const errors = validateRow(row);
    const { duplicateFilenames, duplicateTitles } = checkForDuplicates(csvData);
    
    if (duplicateFilenames.includes(row.filename.toLowerCase().trim())) {
      errors.push('Duplicate filename');
    }
    if (duplicateTitles.includes(row.title.toLowerCase().trim())) {
      errors.push('Duplicate title');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return (
    <>
      <CSVProjectManager 
        csvData={csvData}
        setCsvData={setCsvData}
        currentProjectId={currentProjectId}
        setCurrentProjectId={setCurrentProjectId || (() => {})}
      />
      
      {/* Auto-Save Settings */}
      {user && (
        <div className="mb-6">
          <AutoSaveSettings />
        </div>
      )}
      
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
          <Download className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Adobe Stock CSV Export</h2>
          <p className="text-sm text-gray-600">Create CSV file for Adobe Stock metadata upload</p>
        </div>
      </div>

      {/* Validation Summary */}
      {csvData.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Export Status:</span>
            <div className="flex items-center gap-4">
              <span className="text-green-600">
                ✓ {csvData.filter(row => getRowValidation(row).isValid).length} Valid
              </span>
              <span className="text-red-600">
                ✗ {csvData.filter(row => !getRowValidation(row).isValid).length} Invalid
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Clear All Data</h4>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to clear all CSV data? This will remove all {csvData.length} rows.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearAll}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleAddManualRow}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Add New Row</span>
        </button>
        {csvData.length > 0 && (
          <>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Export CSV ({csvData.length})</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-3 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-medium text-sm sm:text-base"
            >
              Clear All
            </button>
          </>
        )}
      </div>

      {/* CSV Data Cards */}
      {csvData.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {csvData.map((row, index) => (
            <div key={row.id} className={`rounded-lg border p-4 transition-all ${
              getRowValidation(row).isValid 
                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    getRowValidation(row).isValid 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Asset #{index + 1}</h3>
                </div>
                <button
                  onClick={() => handleRemoveRow(row.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Remove this row"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Show validation errors */}
              {!getRowValidation(row).isValid && (
                <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-xs">
                  <div className="font-medium text-red-800 mb-1">Issues:</div>
                  <ul className="text-red-700 space-y-1">
                    {getRowValidation(row).errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Image Upload Section */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Image & Filename</label>
                  <div className="flex gap-3">
                    {row.imageUrl ? (
                      <div className="relative group flex-shrink-0">
                        <img 
                          src={row.imageUrl} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                          <label className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-white rounded p-1">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleImageUploadForRow(row.id, e)}
                              className="hidden"
                            />
                            <Upload className="h-3 w-3 text-gray-600" />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex-shrink-0">
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                          <Image className="h-6 w-6 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Upload</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => handleImageUploadForRow(row.id, e)}
                          className="hidden"
                          ref={(el) => fileInputRefs.current[row.id] = el}
                        />
                      </label>
                    )}
                    
                    {/* Filename Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={row.filename}
                        onChange={(e) => handleRowChange(row.id, 'filename', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                          row.filename && !/\.(jpg|jpeg|png|gif|mp4|mov|avi)$/i.test(row.filename)
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="filename.jpg"
                      />
                      <div className="text-xs text-gray-500 mt-1">Include file extension</div>
                    </div>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => handleRowChange(row.id, 'title', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                        row.title.length < 10 || row.title.length > 200
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      placeholder="Descriptive title (10-200 characters)"
                      maxLength={200}
                    />
                    <div className={`text-xs mt-1 ${
                      row.title.length < 10 || row.title.length > 200 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {row.title.length}/200 characters {row.title.length < 10 ? '(min 10)' : ''}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Keywords</label>
                    <textarea
                      value={row.keywords}
                      onChange={(e) => handleRowChange(row.id, 'keywords', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none ${
                        (() => {
                          const keywordCount = row.keywords.split(',').filter(k => k.trim()).length;
                          return keywordCount < 5 || keywordCount > 50 ? 'border-red-300 bg-red-50' : 'border-gray-300';
                        })()
                      }`}
                      placeholder="keyword1, keyword2, keyword3... (comma separated)"
                      rows={2}
                    />
                    <div className={`text-xs mt-1 ${
                      (() => {
                        const keywordCount = row.keywords.split(',').filter(k => k.trim()).length;
                        return keywordCount < 5 || keywordCount > 50 ? 'text-red-500' : 'text-gray-500';
                      })()
                    }`}>
                      {row.keywords.split(',').filter(k => k.trim()).length} keywords (5-50 required)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <div className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded text-gray-700 font-medium">
                        Graphic Resources
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Releases</label>
                      <input
                        type="text"
                        value={row.releases}
                        onChange={(e) => handleRowChange(row.id, 'releases', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Release names (optional)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No data to export</h3>
            <p className="text-gray-600 mb-6">Add rows manually or use the generators above to get started</p>
            <button
              onClick={handleAddManualRow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add Your First Row
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          How to Use
        </h3>
        <div className="grid grid-cols-1 gap-2 text-xs text-blue-800">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
              <span>Generate prompts using the generators above</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
              <span>Click the AI wand button to create titles and keywords</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
              <span>Upload images for each row (filename will auto-populate with extension)</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
              <span>Ensure all validation rules are met (green indicators)</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</div>
              <span>Review and edit metadata as needed</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">6</div>
              <span>Export CSV file for Adobe Stock upload</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdobeStockExport;