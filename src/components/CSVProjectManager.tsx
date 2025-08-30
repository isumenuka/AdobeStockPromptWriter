import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Cloud, Plus, RefreshCw, X, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateProjectName, rateLimiter } from '../utils/inputValidation';
import { 
  saveCSVProject, 
  loadCSVProject, 
  getUserCSVProjects,
  deleteCSVProject
} from '../services/csvProjects';
import type { CSVRow } from '../types';
import type { CSVProject } from '../services/csvProjects';

interface CSVProjectManagerProps {
  csvData: CSVRow[];
  setCsvData: React.Dispatch<React.SetStateAction<CSVRow[]>>;
  currentProjectId?: string;
  setCurrentProjectId: (id: string | undefined) => void;
}

const CSVProjectManager: React.FC<CSVProjectManagerProps> = ({ 
  csvData, 
  setCsvData, 
  currentProjectId, 
  setCurrentProjectId 
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CSVProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedExistingProject, setSelectedExistingProject] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<CSVProject | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { projects: userProjects, error } = await getUserCSVProjects();
      if (!error) {
        setProjects(userProjects);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (csvData.length === 0) {
      alert('No data to save. Please add some rows first.');
      return;
    }
    
    setShowSaveModal(true);
    setNewProjectName(`CSV Project ${new Date().toLocaleDateString()}`);
    setSelectedExistingProject('');
  };

  const handleSaveNewProject = async () => {
    // Rate limiting check
    const clientId = 'csv_project_save';
    if (!rateLimiter.isAllowed(clientId, 5, 60 * 1000)) { // 5 saves per minute
      const timeUntilReset = rateLimiter.getTimeUntilReset(clientId, 60 * 1000);
      setError(`Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds.`);
      return;
    }
    
    // Validate project name
    const validation = validateProjectName(newProjectName);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid project name');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { success, projectId, error } = await saveCSVProject(validation.isValid ? newProjectName.trim() : '', csvData);

      if (success && projectId) {
        setCurrentProjectId(projectId);
        await loadProjects();
        setShowSaveModal(false);
        setSuccess(`Project "${newProjectName}" saved successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to save: ${error}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExistingProject = async () => {
    if (!selectedExistingProject) {
      setError('Please select a project to update.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const project = projects.find(p => p.id === selectedExistingProject);
      if (!project) {
        setError('Selected project not found.');
        return;
      }

      const { success, error } = await saveCSVProject(
        project.project_name,
        csvData,
        project.description,
        selectedExistingProject
      );

      if (success) {
        setCurrentProjectId(selectedExistingProject);
        await loadProjects();
        setShowSaveModal(false);
        setSuccess(`Project "${project.project_name}" updated successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to update: ${error}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeletingProjectId(projectToDelete.id);
    try {
      const { success, error } = await deleteCSVProject(projectToDelete.id);

      if (success) {
        await loadProjects();
        if (currentProjectId === projectToDelete.id) {
          setCurrentProjectId(undefined);
        }
        setSuccess(`Project "${projectToDelete.project_name}" deleted successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to delete: ${error}`);
      }
    } finally {
      setDeletingProjectId(null);
      setProjectToDelete(null);
    }
  };

  const handleQuickLoad = async (project: CSVProject) => {
    try {
      const dataWithIds = project.csv_data.map(row => ({
        ...row,
        id: row.id || `${Date.now()}-${Math.random()}`
      }));
      
      setCsvData(dataWithIds);
      setCurrentProjectId(project.id);
      setSuccess(`Loaded "${project.project_name}"!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to load project');
    }
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md">
          <Cloud className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Cloud Storage</h2>
          <p className="text-xs sm:text-sm text-gray-600">Save your work securely to the cloud</p>
        </div>
      </div>

      {/* Current Project */}
      {currentProject && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-emerald-900 text-sm sm:text-base">{currentProject.project_name}</h3>
              <p className="text-xs sm:text-sm text-emerald-700">{currentProject.total_rows} rows</p>
            </div>
            <Cloud className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      )}

      {/* Simple Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-sm sm:text-base"
        >
          <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Save to Cloud</span>
          <span className="sm:hidden">Save</span>
        </button>

        {projects.length > 0 && (
          <div className="relative flex-1 sm:flex-initial">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const project = projects.find(p => p.id === e.target.value);
                  if (project) handleQuickLoad(project);
                }
                e.target.value = ''; // Reset select
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base"
              defaultValue=""
            >
              <option value="" disabled>
                <span className="hidden sm:inline">Load Project...</span>
                <span className="sm:hidden">Load...</span>
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  <span className="hidden sm:inline">{project.project_name} ({project.total_rows} rows)</span>
                  <span className="sm:hidden">{project.project_name.length > 20 ? project.project_name.substring(0, 20) + '...' : project.project_name}</span>
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
          <p className="text-green-800 text-xs sm:text-sm">✅ {success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
          <p className="text-red-800 text-xs sm:text-sm">❌ {error}</p>
        </div>
      )}

      {/* Simple Info */}
      <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
        💡 {user ? 'Your work is automatically saved to the cloud every 3 seconds' : 'Sign in to enable auto-save and cloud sync'}
      </div>

      {/* Save Project Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Save CSV Project</h3>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message in Modal */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Save as New Project */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Save as New Project</h4>
                </div>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />
                <button
                  onClick={handleSaveNewProject}
                  disabled={saving || !newProjectName.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create New Project
                    </>
                  )}
                </button>
              </div>

              {/* Update Existing Project */}
              {projects.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Update Existing Project</h4>
                  </div>
                  <div className="space-y-2 mb-3">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                        <input
                          type="radio"
                          id={`project-${project.id}`}
                          name="selectedProject"
                          value={project.id}
                          checked={selectedExistingProject === project.id}
                          onChange={(e) => setSelectedExistingProject(e.target.value)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={`project-${project.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium text-gray-900">{project.project_name}</div>
                          <div className="text-sm text-gray-500">{project.total_rows} rows • {new Date(project.updated_at).toLocaleDateString()}</div>
                        </label>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={deletingProjectId === project.id}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete project"
                        >
                          {deletingProjectId === project.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleUpdateExistingProject}
                    disabled={saving || !selectedExistingProject}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Update Project
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {projectToDelete && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Delete Project</h4>
                        <p className="text-sm text-gray-600">This action cannot be undone</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-6">
                      Are you sure you want to delete <strong>"{projectToDelete.project_name}"</strong>?
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setProjectToDelete(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteProject}
                        disabled={deletingProjectId === projectToDelete.id}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {deletingProjectId === projectToDelete.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVProjectManager;