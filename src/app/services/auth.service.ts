import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  ForgotPasswordResponse,
  OtpSendResponse,
  ResetPasswordResponse,
} from '../models';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/register`, {
      email,
      password,
    });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/login`, {
      email,
      password,
    });
  }

  bootstrapAdmin(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/bootstrap-admin`, {});
  }

  saveToken(data: AuthResponse): void {
    localStorage.setItem('exp_tracker_token', data.token);
    localStorage.setItem('exp_tracker_expires_at', data.expiresAt);
  }

  getToken(): string | null {
    return localStorage.getItem('exp_tracker_token');
  }

  clearToken(): void {
    localStorage.removeItem('exp_tracker_token');
    localStorage.removeItem('exp_tracker_expires_at');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const expiresAt = localStorage.getItem('exp_tracker_expires_at');
    if (!expiresAt) {
      return false;
    }
    return new Date(expiresAt) > new Date();
  }

  getUserRole(): string | null {
    return this.getClaimValue([
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
      'role',
    ]);
  }

  getUserId(): number | null {
    const userId = this.getClaimValue([
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
      'sub',
    ]);

    if (!userId) {
      return null;
    }

    const parsed = Number(userId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  isAdmin(): boolean {
    return this.getUserRole()?.toLowerCase() === 'admin';
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${API_BASE}/auth/forgot-password`,
      { email },
    );
  }

  resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${API_BASE}/auth/reset-password`,
      { email, token, newPassword },
    );
  }

  sendOtp(email: string): Observable<OtpSendResponse> {
    return this.http.post<OtpSendResponse>(`${API_BASE}/auth/send-otp`, {
      email,
    });
  }

  verifyOtp(
    email: string,
    otp: string,
    password: string,
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/register-otp`, {
      email,
      otp,
      password,
    });
  }

  private getClaimValue(claimNames: string[]): string | null {
    const payload = this.getTokenPayload();
    if (!payload) {
      return null;
    }

    for (const claimName of claimNames) {
      const value = payload[claimName];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private getTokenPayload(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const segments = token.split('.');
    if (segments.length < 2) {
      return null;
    }

    try {
      const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const normalized = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '=',
      );
      return JSON.parse(window.atob(normalized)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
