import { api, getCsrfCookie } from './api';

export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  roles: Role[];
}

export async function getMembers(): Promise<Member[]> {
  const response = await api.get<Member[]>('/organization/users');
  return response.data;
}

export async function getRoles(): Promise<Role[]> {
  const response = await api.get<Role[]>('/organization/roles');
  return response.data;
}

export async function updateMemberRole(userId: number, roleId: number): Promise<void> {
  await api.put(`/organization/users/${userId}/role`, { role_id: roleId });
}

export async function inviteMember(email: string, roleId: number): Promise<void> {
  await api.post('/organization/invitations', { email, role_id: roleId });
}

export interface InvitationDetails {
  organization_name: string;
  role_name: string;
  email: string;
}

export async function getInvitation(token: string): Promise<InvitationDetails> {
  const response = await api.get<InvitationDetails>(`/invitations/${token}`);
  return response.data;
}

export async function acceptInvitation(
  token: string,
  name: string,
  password: string,
  passwordConfirmation: string
): Promise<void> {
  await getCsrfCookie();

  await api.post(`/invitations/${token}/accept`, {
    name,
    password,
    password_confirmation: passwordConfirmation,
  });
}
