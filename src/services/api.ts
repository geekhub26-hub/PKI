import axios from 'axios';
import { notify } from '../utils/notify';

/**
 * Configuration de l'API client pour communiquer avec le backend
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';
const API_BASE_URL_CLEAN = API_BASE_URL.replace(/\/+$/, '');

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requete invalide. Verifiez les informations saisies.',
  401: 'Session expiree. Veuillez vous reconnecter.',
  403: 'Acces refuse pour cette operation.',
  404: 'Ressource introuvable.',
  409: 'Conflit detecte. La ressource existe deja ou son etat ne permet pas cette action.',
  413: 'Fichier trop volumineux.',
  415: 'Format de donnees non supporte.',
  422: 'Certaines donnees ne sont pas valides.',
  429: 'Trop de requetes. Reessayez dans quelques instants.',
  500: 'Erreur serveur interne. Reessayez plus tard.',
  502: 'Service temporairement indisponible.',
  503: 'Service indisponible. Reessayez plus tard.',
  504: 'Le delai de reponse est depasse.',
};

export function readApiError(err: any, fallback = 'Une erreur est survenue.'): string {
  const status = err?.response?.status;
  const payload = err?.response?.data;
  const normalizeBackendMessage = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('echec signature csr') || lower.includes('ca-store') || lower.includes('.pem')) {
      return 'Impossible de signer la CSR: AC absente ou non configuree. Veuillez initialiser/regenerer l AC.';
    }
    if (lower.includes('request must be in csr_submitted state')) {
      return 'Cette demande ne peut pas etre signee maintenant. Le CSR utilisateur n est pas encore soumis.';
    }
    if (lower.includes('no csr provided')) {
      return 'Aucun CSR n a ete fourni pour cette demande.';
    }
    if (lower.includes('maximum upload size exceeded')) {
      return 'Fichier trop volumineux.';
    }
    return msg;
  };

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return normalizeBackendMessage(payload.trim());
  }
  if (payload?.error) return normalizeBackendMessage(String(payload.error));
  if (payload?.message) return normalizeBackendMessage(String(payload.message));
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (err?.code === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('timeout')) {
    return 'Le serveur met trop de temps a repondre. Veuillez reessayer.';
  }
  if (err?.message === 'Network Error') {
    return 'Impossible de joindre le serveur. Verifiez votre connexion.';
  }
  return fallback;
}

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (token expiré)
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    error.message = readApiError(error, 'Erreur de communication avec le serveur.');
    notify('error', error.message);

    if (error.response?.status === 401) {
      // Token expiré : redirection vers login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Types de données
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN' | 'AE_CENTRALE' | 'ADMIN_AEL' | 'AEL';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface OtpRequiredResponse {
  status: 'OTP_REQUIRED';
  email: string;
}

export interface TwoFaRequiredResponse {
  status: '2FA_REQUIRED';
  pendingToken: string;
}

export interface DashboardData {
  totalUsers: number;
  pendingRequests: number;
  activeCertificates: number;
  revokedCertificates: number;
  caStatus: CAStatus;
}

export interface CAStatus {
  isActive: boolean;
  isInitialized: boolean;
  caName?: string;
  validFrom?: string;
  validUntil?: string;
  daysUntilExpiration?: number;
  subjectDN?: string;
}

/**
 * API Service
 */
export const authService = {
  /**
   * Inscription
   */
  register: async (data: RegisterRequest): Promise<OtpRequiredResponse> => {
    const payload = { ...data, email: data.email.trim().toLowerCase() };
    const response = await apiClient.post<OtpRequiredResponse>('/auth/register', payload);
    return response.data;
  },

  verifyOtp: async (email: string, code: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/verify-otp', { email, code });
    return response.data;
  },

  resendOtp: async (email: string): Promise<void> => {
    await apiClient.post('/auth/resend-otp', { email });
  },

  /**
   * Connexion — retourne JwtResponse ou TwoFaRequiredResponse
   */
  login: async (data: LoginRequest): Promise<JwtResponse | TwoFaRequiredResponse> => {
    const payload = { ...data, email: data.email.trim().toLowerCase() };
    const response = await apiClient.post<JwtResponse | TwoFaRequiredResponse>('/auth/login', payload);
    if ((response.data as any).status === '2FA_REQUIRED') return response.data;
    const jwt = response.data as JwtResponse;
    localStorage.setItem('accessToken', jwt.accessToken);
    localStorage.setItem('refreshToken', jwt.refreshToken);
    return jwt;
  },

  verify2Fa: async (pendingToken: string, code: string): Promise<JwtResponse> => {
    const response = await apiClient.post<JwtResponse>('/auth/verify-2fa', { pendingToken, code });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  },

  /**
   * Déconnexion
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/#/login';
  },

  /**
   * Demande de réinitialisation de mot de passe
   */
  forgotPassword: async (email: string): Promise<any> => {
    const response = await apiClient.post<any>('/auth/forgot-password', { email: email.trim().toLowerCase() });
    return response.data;
  },

  /**
   * Réinitialise le mot de passe
   */
  resetPassword: async (token: string, password: string): Promise<any> => {
    const response = await apiClient.post<any>('/auth/reset-password', { token, password });
    return response.data;
  },
};

export interface Certificate {
  id: string;
  serialNumber: string;
  subjectDN: string;
  issuerDN: string;
  status: string;
  notBefore: string;
  notAfter: string;
  certificatePem: string;
}

export interface AdminCertificate {
  id: string;
  userId?: string;
  userEmail?: string;
  serialNumber: string;
  subjectDN: string;
  issuerDN: string;
  status: string;
  issuedAt?: string;
  notAfter?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface UserCertificateRequest {
  id: string;
  commonName: string;
  organization: string;
  organizationalUnit?: string;
  locality?: string;
  state?: string;
  country?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  identityDocumentType?: string;
  identityDocumentNumber?: string;
  identityDocumentExpiry?: string;
  status: string;
  submittedAt?: string;
  rejectionReason?: string;
  documents: string[];
  notes?: string;
}

export const userService = {
  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/user/me');
    return response.data;
  },
  /**
   * Récupérer les certificats de l'utilisateur connecté
   */
  getMyCertificates: async (): Promise<Certificate[]> => {
    const response = await apiClient.get<Certificate[]>('/user/certificates');
    return response.data;
  },

  /**
   * Etapes 1-2: soumettre pour verification admin
   */
  submitCertificateRequest: async (form: FormData): Promise<any> => {
    const response = await apiClient.post('/user/certificate-requests', form, {
      timeout: 120000,
    });
    return response.data;
  },

  /**
   * Correction et resoumission apres rejet admin
   */
  updateCertificateRequest: async (requestId: string, form: FormData): Promise<any> => {
    const response = await apiClient.put(`/user/certificate-requests/${requestId}`, form);
    return response.data;
  },

  /**
   * Etape 3: soumission CSR apres validation admin
   */
  submitRequestCsr: async (requestId: string, form: FormData): Promise<any> => {
    const response = await apiClient.post(`/user/certificate-requests/${requestId}/submit-csr`, form);
    return response.data;
  },

  generateAndSubmitRequestCsr: async (
    requestId: string,
    payload: { cn: string; o: string; ou?: string; l?: string; st?: string; c: string; email?: string }
  ): Promise<any> => {
    const response = await apiClient.post(`/user/certificate-requests/${requestId}/generate-csr`, null, {
      params: payload,
    });
    return response.data;
  },

  /**
   * Récupérer les demandes de certificats de l'utilisateur
   */
  getMyRequests: async (): Promise<UserCertificateRequest[]> => {
    const response = await apiClient.get<UserCertificateRequest[]>('/user/certificate-requests');
    return response.data;
  },

  getRequestDocumentBlob: async (requestId: string, filename: string, preview = false): Promise<Blob> => {
    const response = await apiClient.get(
      `/user/certificate-requests/${requestId}/documents/${encodeURIComponent(filename)}`,
      {
        params: { preview },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  validateToken: async (
    requestId: string,
    token: string
  ): Promise<{ certificateId: string; certificate: string; fingerprint: string; issuedAt: string; expiresAt: string }> => {
    const response = await apiClient.post(
      `/user/certificate-requests/${requestId}/validate-token`,
      null,
      { params: { token } }
    );
    return response.data as { certificateId: string; certificate: string; fingerprint: string; issuedAt: string; expiresAt: string };
  },

  /**
   * Télécharger un certificat par ID
   */
  downloadCertificate: async (certificateId: string, format: 'pem' | 'crt' = 'pem'): Promise<Blob> => {
    const response = await apiClient.get(`/user/certificates/${certificateId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  downloadCertificateP12: async (certificateId: string, password: string): Promise<Blob> => {
    const response = await apiClient.post(
      `/user/certificates/${certificateId}/download-p12`,
      { password },
      { responseType: 'blob' }
    );
    return response.data as Blob;
  },

  revokeCertificate: async (certificateId: string, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/user/certificates/${certificateId}/revoke`, null, {
      params: { reason },
    });
    return response.data;
  },

  renewCertificate: async (certificateId: string): Promise<any> => {
    const response = await apiClient.post(`/user/certificates/${certificateId}/renew`);
    return response.data;
  },

  getCrl: async (): Promise<string> => {
    const response = await apiClient.get<string>('/user/crl');
    return response.data;
  },
};

export const adminService = {
  /**
   * Récupérer le dashboard admin
   */
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>('/admin/dashboard');
    return response.data;
  },

  /**
   * Initialiser l'AC Racine
   */
  initializeCA: async (): Promise<CAStatus> => {
    const response = await apiClient.post<CAStatus>('/admin/ca/initialize');
    return response.data;
  },

  generateRootCA: async (name: string): Promise<any> => {
    const response = await apiClient.post('/admin/generate-ca', null, {
      params: { name },
    });
    return response.data;
  },

  generateIntermediateCA: async (payload: { name: string; keySize: number; validityDays: number }): Promise<any> => {
    const response = await apiClient.post('/admin/generate-intermediate-ca', null, {
      params: payload,
    });
    return response.data;
  },

  /**
   * Récupérer le statut de l'AC
   */
  getCAStatus: async (): Promise<CAStatus> => {
    const response = await apiClient.get<CAStatus>('/admin/ca/status');
    return response.data;
  },

  /**
   * Certificate request management (admin)
   */
  getCertificateRequests: async (status?: string, page = 0, size = 20): Promise<{ items: any[]; total: number; page: number; size: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));
    const url = `/admin/certificate-requests?${params.toString()}`;
    const response = await apiClient.get<any>(url);
    return response.data;
  },

  getCertificateRequest: async (id: string): Promise<any> => {
    const response = await apiClient.get<any>(`/admin/certificate-requests/${id}`);
    return response.data;
  },

  downloadRequestDocument: (requestId: string, filename: string): string => {
    // URL backend absolue pour fonctionner en production
    return `${API_BASE_URL_CLEAN}/admin/certificate-requests/${requestId}/documents/${encodeURIComponent(filename)}`;
  },

  getRequestDocumentBlob: async (requestId: string, filename: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/admin/certificate-requests/${requestId}/documents/${encodeURIComponent(filename)}`,
      { responseType: 'blob' }
    );
    return response.data as Blob;
  },

  approveRequest: async (id: string, validityDays = 365): Promise<any> => {
    const response = await apiClient.post(`/admin/certificate-requests/${id}/approve`, null, { params: { validityDays } });
    return response.data;
  },

  rejectRequest: async (id: string, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/admin/certificate-requests/${id}/reject`, null, { params: { reason } });
    return response.data;
  },

  reviewApprove: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/admin/certificate-requests/${id}/review-approve`);
    return response.data;
  },

  reviewReject: async (id: string, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/admin/certificate-requests/${id}/review-reject`, null, { params: { reason } });
    return response.data;
  },

  signCsr: async (csrPem: string, validityDays = 365, userId?: string): Promise<any> => {
    const response = await apiClient.post(`/admin/sign-csr`, csrPem, {
      params: { validityDays, userId },
      headers: { 'Content-Type': 'text/plain' },
    });
    return response.data;
  },

  generateCrl: async (): Promise<any> => {
    const response = await apiClient.post('/admin/generate-crl');
    return response.data;
  },

  rotateCrl: async (): Promise<any> => {
    const response = await apiClient.post('/admin/rotate-crl');
    return response.data;
  },

  getCrl: async (): Promise<string> => {
    const response = await apiClient.get<string>('/admin/crl');
    return response.data;
  },

  getCertificates: async (
    status?: string,
    page = 0,
    size = 20
  ): Promise<{ items: AdminCertificate[]; total: number; page: number; size: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));
    const response = await apiClient.get<{ items: AdminCertificate[]; total: number; page: number; size: number; totalPages: number }>(
      `/admin/certificates?${params.toString()}`
    );
    return response.data;
  },

  getAuditLogs: async (
    action?: string,
    page = 0,
    size = 20
  ): Promise<{ items: any[]; total: number; page: number; size: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (action && action !== 'ALL') params.set('action', action);
    params.set('page', String(page));
    params.set('size', String(size));
    const response = await apiClient.get<{ items: any[]; total: number; page: number; size: number; totalPages: number }>(
      `/admin/audit-logs?${params.toString()}`
    );
    return response.data;
  },

  revokeCertificate: async (certificateId: string, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/admin/revoke/${certificateId}`, null, { params: { reason } });
    return response.data;
  },

  /**
   * User management (admin)
   */
  getUsers: async (page = 0, size = 20): Promise<{ items: any[]; total: number; page: number; size: number; totalPages: number }> => {
    const params = { page: String(page), size: String(size) };
    const response = await apiClient.get<any>(`/admin/users`, { params });
    return response.data;
  },

  deleteUser: async (userId: string): Promise<any> => {
    const response = await apiClient.delete<any>(`/admin/users/${userId}`);
    return response.data;
  },
};




