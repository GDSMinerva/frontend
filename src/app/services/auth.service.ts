import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { LoginRequest, SignUpRequest, AuthResponse, DecodedToken, AuthState } from '../models/auth.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  
  // API URL from environment configuration
  private readonly API_URL = environment.apiUrl;
  
  // Keys used for storing data in localStorage/StorageService
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  // BehaviorSubject to hold the current authentication state.
  // We use a BehaviorSubject so that new subscribers immediately get the latest value.
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  // Public observable for components to subscribe to auth changes
  public authState$ = this.authState.asObservable();

  constructor() {
    // Initialize auth state on service creation (e.g., app load)
    this.initializeAuth();
  }

  /**
   * Initializes authentication state by checking for existing tokens.
   * If a valid token exists, it restores the user's session.
   */
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
      // If no valid token, ensure state is clear
      this.clearAuthData();
    }
  }

  /**
   * Login with email and password
   * Sends credentials to the API (or MockApiInterceptor)
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
   * Sign up with new account details
   * Sends registration data to the API (or MockApiInterceptor)
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
   * Logout the current user.
   * Clears tokens from storage and resets the auth state.
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
   * Helper to get the current snapshot of auth state
   */
  getAuthState(): AuthState {
    return this.authState.value;
  }

  /**
   * Retrieves the access token from storage
   */
  getToken(): string | null {
    return this.storageService.getItem(this.TOKEN_KEY);
  }

  /**
   * Retrieves the refresh token from storage
   */
  getRefreshToken(): string | null {
    return this.storageService.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Checks if the user is currently authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid(token);
  }

  /**
   * Decodes a JWT token to extract its payload (claims).
   * Note: This does not verify the signature, just reads the data.
   * @param token - JWT token string
   * @returns DecodedToken object or null if invalid
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

      // Decode Base64Url encoded payload
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
   * Checks if a token is valid based on its expiration time (exp claim).
   * @param token - JWT token string
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
   * Attempts to refresh the access token using the refresh token.
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
          // If refresh fails (e.g., bad token), clear auth to force re-login
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  /**
   * Centralized handler for successful login/signup responses.
   * Stores tokens and updates the auth state subject.
   */
  private handleAuthResponse(response: AuthResponse): void {
    if (response.accessToken) {
      this.storageService.setItem(this.TOKEN_KEY, response.accessToken);
      
      if (response.refreshToken) {
        this.storageService.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
      }

      if (response.user) {
        this.storageService.setItem(this.USER_KEY, JSON.stringify(response.user));
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
   * Retrieves the user object from storage
   */
  private getStoredUser(): any {
    const userJson = this.storageService.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Clears all authentication-related data from storage
   */
  private clearAuthData(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
  }

  /**
   * Standardized error handling for auth requests
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
