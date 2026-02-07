import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { LoginRequest, SignUpRequest, AuthResponse, DecodedToken, AuthState } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  public authState$ = this.authState.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    if (token && this.isTokenValid(token)) {
      this.authState.next({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null
      });
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Login with email and password
   * @param credentials - Email and password
   * @returns Observable of AuthResponse
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Sign up with new account
   * @param data - SignUp form data
   * @returns Observable of AuthResponse
   */
  signUp(data: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/signup`, data)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Logout and clear auth data
   */
  logout(): void {
    this.clearAuthData();
    this.authState.next({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    });
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return this.authState.value;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid(token);
  }

  /**
   * Decode JWT token to get claims
   * @param token - JWT token
   * @returns Decoded token or null if invalid
   */
  decodeToken(token?: string): DecodedToken | null {
    const tokenToDecode = token || this.getToken();
    
    if (!tokenToDecode) {
      return null;
    }

    try {
      const parts = tokenToDecode.split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const decoded = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      return decoded as DecodedToken;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  /**
   * Check if token is still valid (not expired)
   * @param token - JWT token
   */
  isTokenValid(token: string): boolean {
    const decoded = this.decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  }

  /**
   * Refresh the JWT token
   * @returns Observable of AuthResponse
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  /**
   * Handle successful authentication response
   */
  private handleAuthResponse(response: AuthResponse): void {
    if (response.accessToken) {
      localStorage.setItem(this.TOKEN_KEY, response.accessToken);
      
      if (response.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
      }

      if (response.user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      }

      const decodedToken = this.decodeToken(response.accessToken);
      
      this.authState.next({
        isAuthenticated: true,
        user: response.user || decodedToken,
        token: response.accessToken,
        loading: false,
        error: null
      });
    }
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): any {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status) {
      errorMessage = error.error?.message || `HTTP Error: ${error.status}`;
    }

    this.authState.next({
      ...this.authState.value,
      error: errorMessage,
      loading: false
    });

    return throwError(() => new Error(errorMessage));
  }
}
