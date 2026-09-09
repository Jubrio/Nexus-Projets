import { api } from './api';

export interface Document {
  id: number;
  name: string;
  file_name: string;
  mime_type: string | null;
  size: number | null;
  path: string;
  url: string;
  user: { id: number; name: string };
  created_at: string;
}

export interface Documentable {
  type: string;
  id: number;
}

export async function getDocuments(documentable?: Documentable): Promise<Document[]> {
  const params = documentable
    ? { documentable_type: documentable.type, documentable_id: documentable.id }
    : {};
  const response = await api.get<Document[]>('/documents', { params });
  return response.data;
}

export async function uploadDocument(
  file: File,
  documentable: Documentable,
  name?: string
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentable_type', documentable.type);
  formData.append('documentable_id', String(documentable.id));
  if (name) formData.append('name', name);

  const response = await api.post<Document>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export function getDownloadUrl(documentId: number): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  return `${apiUrl}/documents/${documentId}/download`;
}
