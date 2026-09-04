import { api } from './api';

export interface EnableTwoFactorResponse {
  message: string;
  secret: string;
  qr_code_url: string;
}

export interface ConfirmTwoFactorResponse {
  message: string;
  recovery_codes: string[];
}

export async function enableTwoFactor(): Promise<EnableTwoFactorResponse> {
  const response = await api.post<EnableTwoFactorResponse>('/2fa/enable');
  return response.data;
}

export async function confirmTwoFactor(code: string): Promise<ConfirmTwoFactorResponse> {
  const response = await api.post<ConfirmTwoFactorResponse>('/2fa/confirm', { code });
  return response.data;
}

export async function disableTwoFactor(password: string): Promise<{ message: string }> {
  const response = await api.post('/2fa/disable', { password });
  return response.data;
}
