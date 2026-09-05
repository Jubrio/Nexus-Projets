import { api } from './api';

export interface ProjectMember {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  tasks_count?: number;
  creator: ProjectMember;
  members?: ProjectMember[];
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  position: number;
  due_date: string | null;
  assignee: ProjectMember | null;
  creator: ProjectMember;
}

export interface TasksByStatus {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}

export interface TaskComment {
  id: number;
  content: string;
  created_at: string;
  user: ProjectMember;
}

export async function getProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>('/projects');
  return response.data;
}

export async function createProject(name: string, description: string): Promise<Project> {
  const response = await api.post<Project>('/projects', { name, description });
  return response.data;
}

export async function getProject(projectId: number): Promise<Project> {
  const response = await api.get<Project>(`/projects/${projectId}`);
  return response.data;
}

export async function getTasks(projectId: number): Promise<TasksByStatus> {
  const response = await api.get<TasksByStatus>(`/projects/${projectId}/tasks`);
  return response.data;
}

export async function createTask(
  projectId: number,
  title: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): Promise<Task> {
  const response = await api.post<Task>(`/projects/${projectId}/tasks`, { title, priority });
  return response.data;
}

export async function updateTaskStatus(
  projectId: number,
  taskId: number,
  status: 'todo' | 'in_progress' | 'done'
): Promise<Task> {
  const response = await api.put<Task>(`/projects/${projectId}/tasks/${taskId}`, { status });
  return response.data;
}

export async function deleteTask(projectId: number, taskId: number): Promise<void> {
  await api.delete(`/projects/${projectId}/tasks/${taskId}`);
}

export async function getTaskComments(taskId: number): Promise<TaskComment[]> {
  const response = await api.get<TaskComment[]>(`/tasks/${taskId}/comments`);
  return response.data;
}

export async function addTaskComment(taskId: number, content: string): Promise<TaskComment> {
  const response = await api.post<TaskComment>(`/tasks/${taskId}/comments`, { content });
  return response.data;
}
