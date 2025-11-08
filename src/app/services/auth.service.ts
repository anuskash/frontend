import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, User, CreateUserRequest, AppUserResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * POST /login (not /auth/login)
   * Basic login with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const params = new HttpParams()
      .set('email', credentials.email)
      .set('password', credentials.password);
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  // Enhanced login with 2FA support
  loginV2(email: string, password: string, twoFactorCode?: string): Observable<any> {
    const payload: any = { email, password };
    if (twoFactorCode) {
      payload.twoFactorCode = twoFactorCode;
    }
    return this.http.post(`${this.apiUrl}/auth/login/v2`, payload);
  }

  // Email Verification
  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { email, code });
  }

  resendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/resend-verification`, { email });
  }

  // Failed Login Verification (after 2 wrong attempts)
  sendFailedLoginVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/send-login-verification`, { email });
  }

  verifyFailedLogin(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-login-attempt`, { email, code });
  }

  // Forgot Password
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  // Request password reset link (from settings)
  requestPasswordResetLink(userId: number, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/request-password-reset`, { userId, email });
  }

  // 2FA Management
  setup2FA(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/2fa/setup`, { userId });
  }

  verify2FA(userId: number, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/2fa/verify`, { userId, code });
  }

  disable2FA(userId: number, password: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('password', password);
    return this.http.post(`${this.apiUrl}/auth/2fa/disable`, {}, { params });
  }

  regenerateBackupCodes(userId: number, verificationCode: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('verificationCode', verificationCode);
    return this.http.post(`${this.apiUrl}/auth/2fa/regenerate-backup-codes`, {}, { params });
  }

  check2FAStatus(userId: number): Observable<any> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get(`${this.apiUrl}/auth/2fa/status`, { params });
  }

  register(request: CreateUserRequest): Observable<AppUserResponse> {
    return this.http.post<AppUserResponse>(`${this.apiUrl}/auth/register`, request);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {});
  }

  isAuthenticated(): boolean {
    const user = localStorage.getItem('currentUser');
    return !!user;
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  removeCurrentUser(): void {
    localStorage.removeItem('currentUser');
  }

  // Legacy methods for backward compatibility
  getToken(): string | null {
    const user = this.getCurrentUser();
    return user ? user.userId.toString() : null;
  }

  setToken(token: string): void {
    // This method is kept for compatibility but doesn't store a token
    console.log('Token method called, but storing user data instead');
  }

  removeToken(): void {
    this.removeCurrentUser();
  }
}