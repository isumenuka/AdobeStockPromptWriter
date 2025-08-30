import { supabase } from './supabase';
import type { CSVRow } from '../types';

export interface CSVProject {
  id: string;
  user_id: string;
  project_name: string;
  description?: string;
  csv_data: CSVRow[];
  total_rows: number;
  created_at: string;
  updated_at: string;
}

/**
 * Save CSV project to cloud
 */
export async function saveCSVProject(
  projectName: string,
  csvData: CSVRow[],
  description?: string,
  projectId?: string
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const projectData = {
      user_id: user.id,
      project_name: projectName,
      description: description || null,
      csv_data: csvData,
      total_rows: csvData.length,
      updated_at: new Date().toISOString()
    };

    if (projectId) {
      // Update existing project
      const { data, error } = await supabase
        .from('csv_projects')
        .update(projectData)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select('id')
        .single();

      if (error) {
        console.error('Error updating CSV project:', error);
        return { success: false, error: error.message };
      }

      return { success: true, projectId: data.id };
    } else {
      // Create new project
      const { data, error } = await supabase
        .from('csv_projects')
        .insert(projectData)
        .select('id')
        .single();

      if (error) {
        console.error('Error saving CSV project:', error);
        return { success: false, error: error.message };
      }

      return { success: true, projectId: data.id };
    }
  } catch (error) {
    console.error('Error saving CSV project:', error);
    return { success: false, error: 'Failed to save CSV project' };
  }
}

/**
 * Load CSV project from cloud
 */
export async function loadCSVProject(projectId: string): Promise<{ project: CSVProject | null; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { project: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('csv_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading CSV project:', error);
      return { project: null, error: error.message };
    }

    return { project: data };
  } catch (error) {
    console.error('Error loading CSV project:', error);
    return { project: null, error: 'Failed to load CSV project' };
  }
}

/**
 * Get all user's CSV projects
 */
export async function getUserCSVProjects(): Promise<{ projects: CSVProject[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { projects: [], error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('csv_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching CSV projects:', error);
      return { projects: [], error: error.message };
    }

    return { projects: data || [] };
  } catch (error) {
    console.error('Error fetching CSV projects:', error);
    return { projects: [], error: 'Failed to fetch CSV projects' };
  }
}

/**
 * Delete CSV project
 */
export async function deleteCSVProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('csv_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting CSV project:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting CSV project:', error);
    return { success: false, error: 'Failed to delete CSV project' };
  }
}

/**
 * Duplicate CSV project
 */
export async function duplicateCSVProject(
  projectId: string,
  newName: string
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const { project, error: loadError } = await loadCSVProject(projectId);
    if (loadError || !project) {
      return { success: false, error: loadError || 'Project not found' };
    }

    return await saveCSVProject(
      newName,
      project.csv_data,
      `Copy of ${project.description || project.project_name}`
    );
  } catch (error) {
    console.error('Error duplicating CSV project:', error);
    return { success: false, error: 'Failed to duplicate CSV project' };
  }
}