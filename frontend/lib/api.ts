import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const BASE_URL = API_URL.replace('/api/v1', '');

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // envoie les cookies de session avec chaque requête
  withXSRFToken: true,   // envoie automatiquement le header X-XSRF-TOKEN depuis le cookie
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Récupère le cookie CSRF de Sanctum avant toute action sensible
 * (register, login, logout, etc.). Doit être appelé une fois avant
 * ces requêtes, car Sanctum protège contre les attaques CSRF.
 */
export async function getCsrfCookie(): Promise<void> {
  await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}
