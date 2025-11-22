const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').toString().trim().replace(/\/$/, '');
const fallbackBase = import.meta.env.DEV ? 'http://localhost:4000' : 'https://kibitz-api-hgwpsm32ra-uc.a.run.app';
export const API_BASE = rawBase || fallbackBase;
export const EVENTS_URL = `${API_BASE}/api/events`;
