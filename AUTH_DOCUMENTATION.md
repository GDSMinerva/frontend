# Authentication & Theme System Documentation

## Overview

This Angular application implements a complete JWT-based authentication system with theme toggle functionality. Both features use localStorage for persistence and follow Angular best practices.

---

## 📋 Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Theme Management](#theme-management)
3. [Security Considerations](#security-considerations)
4. [API Configuration](#api-configuration)
5. [Component Architecture](#component-architecture)
6. [Usage Examples](#usage-examples)

---

## Authentication Flow

### Step-by-Step Process

#### 1. **User Initiates Login/Sign-Up**
   - User fills in credentials (email, password)
   - Form validation occurs in the component
   - User submits the form

#### 2. **Component Calls Auth Service**
   ```typescript
   // Sign In
   this.authService.login({
     email: 'user@example.com',
     password: 'password123'
   }).subscribe(response => {
     // Navigate to dashboard
     this.router.navigate(['/dashboard']);
   });
   ```

#### 3. **HTTP Request to Backend**
   ```
   POST http://localhost:3000/api/auth/login
   Content-Type: application/json
   
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

#### 4. **Backend Validation & Token Generation**
   - Backend validates credentials
   - On success, generates JWT tokens:
     - **Access Token**: Short-lived (15 min), used for API requests
     - **Refresh Token** (optional): Longer-lived (7 days), used to refresh access token
   - Returns response with tokens and user info

#### 5. **Auth Service Processes Response**
   - Extracts JWT from response
   - Stores tokens in localStorage:
     ```
     localStorage['access_token'] = 'eyJhbGc...'
     localStorage['refresh_token'] = 'eyJhbGc...' // if provided
     localStorage['user'] = '{"id":"123","email":"..."}'
     ```
   - Updates internal `authState` BehaviorSubject
   - Decodes JWT to extract user claims

#### 6. **HTTP Interceptor Adds Token to Requests**
   - All HTTP requests automatically include Authorization header:
     ```
     Authorization: Bearer eyJhbGc...
     ```
   - Done by `AuthInterceptor` class

#### 7. **Protected Routes Validation**
   - `authGuard` checks if user is authenticated before accessing protected routes
   - If not authenticated, redirects to login page
   - Uses `isAuthenticated()` method which validates token expiration

#### 8. **Token Refresh (Optional)**
   - When access token expires (401 response):
     1. Interceptor catches the 401 error
     2. Calls `refreshToken()` method with refresh token
     3. Backend validates refresh token and returns new access token
     4. Original request is retried with new token
     5. If refresh fails, user is logged out

#### 9. **Logout**
   - Clears localStorage
   - Updates authState to logged-out status
   - Navigates to login page
   - Next request will fail auth (no token)

### Visual Flow Diagram

```
User Input
    ↓
Component Validation
    ↓
Auth Service.login() / signUp()
    ↓
HTTP Request with AuthInterceptor
    ↓
Backend API
    ↓
JWT Response {accessToken, refreshToken, user}
    ↓
Store in localStorage + Update authState
    ↓
Decode Token & Extract User Info
    ↓
Navigate to Dashboard
```

---

## Theme Management

### Light/Dark Mode System

#### Theme Service Architecture

```typescript
// Centralized theme management
ThemeService {
  - themeSignal: Signal<'dark' | 'light'>
  - localStorage key: 'theme-preference'
  - Methods: toggleTheme(), setTheme(), getCurrentTheme()
}
```

#### Initialization Flow

1. **App Startup**
   - App component injects ThemeService
   - ThemeService constructor runs initialization

2. **Load Persisted Preference**
   ```typescript
   // Priority order:
   1. localStorage['theme-preference']  // User's saved preference
   2. System preference (prefers-color-scheme)  // OS dark/light mode
   3. Default: 'light'
   ```

3. **Apply to DOM**
   ```typescript
   effect(() => {
     const theme = themeSignal();
     if (theme === 'dark') {
       document.documentElement.classList.add('dark');
       document.documentElement.classList.remove('light');
     } else {
       document.documentElement.classList.add('light');
       document.documentElement.classList.remove('dark');
     }
     localStorage.setItem('theme-preference', theme);
   });
   ```

4. **Tailwind Dark Mode**
   - Tailwind configured with `darkMode: 'class'`
   - Classes like `dark:text-white` activate when `dark` class on `<html>`

#### Theme Toggle

```typescript
// User clicks theme button
themeService.toggleTheme();  // 'dark' → 'light' or vice versa

// Triggers:
// 1. Updates signal
// 2. Effect runs automatically
// 3. DOM classes updated
// 4. localStorage updated
// 5. All components using theme$() reactive update
```

#### Component Usage

```html
<!-- In templates -->
<div class="bg-white dark:bg-[#0B0F1A] text-black dark:text-white">
  Theme-aware content
</div>

<!-- Reading current theme -->
{{ themeService.theme$() }}

<!-- Toggling -->
<button (click)="themeService.toggleTheme()">
  <span class="material-symbols-outlined">
    {{ themeService.theme$() === 'dark' ? 'light_mode' : 'dark_mode' }}
  </span>
</button>
```

---

## Security Considerations

### 1. **Token Storage**
⚠️ **Current Implementation: localStorage**
- **Vulnerability**: XSS attacks can access tokens
- **Mitigation Strategies**:
  ```
  a) HTTPOnly Cookies (Recommended)
     - Backend sets token in HTTPOnly cookie
     - JavaScript cannot access
     - Automatic inclusion in requests
     - Immune to XSS
  
  b) Secure Storage (Production)
     - Use native mobile solutions (Keychain/Keystore)
     - Browser extensions or encrypted storage
  
  c) Short Token Expiration
     - Access tokens: 15 minutes
     - Refresh tokens: 7 days (optional)
     - Minimize exposure window
  ```

**TODO for Production:**
```typescript
// Change from localStorage to HTTPOnly cookies
// In auth.service.ts, modify storage methods:
private storeToken(token: string): void {
  // Backend should set HTTPOnly cookie automatically
  // Only store sensitive data if necessary
  // Remove direct token storage from localStorage
}
```

---

### 2. **HTTPS Only**
```typescript
// Environment configuration
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',  // Always HTTPS
  secure: true,
  sameSite: 'Strict'
};

// Cookie settings for production
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict; Domain=yourdomain.com
```

**Implementation:**
- All API calls must use HTTPS in production
- Configure CORS properly on backend
- Set secure cookie flags

---

### 3. **CSRF Protection**
```typescript
// Backend should implement CSRF tokens
// Include in state management:

export interface AuthState {
  csrfToken?: string;
  // ...
}

// Or use SameSite cookies (automatic protection)
// Recommended: SameSite=Strict; HttpOnly; Secure
```

---

### 4. **Token Validation**
```typescript
// Frontend validation
isTokenValid(token: string): boolean {
  const decoded = this.decodeToken(token);
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp > currentTime;
}

// Backend should also validate:
- Token signature (RS256 with public key)
- Expiration time (iat, exp claims)
- Issuer (iss claim)
- Audience (aud claim)
- Token not blacklisted (optional)
```

---

### 5. **Secure Token Refresh**
```typescript
// Current implementation
refreshToken(): Observable<AuthResponse> {
  const refreshToken = this.getRefreshToken();
  return this.http.post(`${this.API_URL}/refresh`, { refreshToken })
    .pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.clearAuthData();  // Logout on failure
        return throwError(() => error);
      })
    );
}

// Production improvements:
// 1. Use POST (not GET)
// 2. Implement token rotation (old token invalidated)
// 3. Rate limit refresh endpoint
// 4. Require additional validation (e.g., IP matching)
```

---

### 6. **Input Validation**
```typescript
// Client-side validation (form validators)
form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]]
});

// Backend MUST also validate:
- Email format and uniqueness
- Password strength (min 8 chars, complexity)
- Rate limiting (prevent brute force)
- Account lockout after N failed attempts
```

---

### 7. **Error Handling**
```typescript
// Avoid exposing sensitive information
private handleError(error: any): Observable<never> {
  let errorMessage = 'An error occurred';
  
  // ❌ Wrong: Don't expose backend errors
  // errorMessage = error.error?.message; // Could leak DB info
  
  // ✅ Correct: Generic error messages
  if (error.status === 401) {
    errorMessage = 'Invalid credentials';
  } else if (error.status === 409) {
    errorMessage = 'Email already registered';
  } else {
    errorMessage = 'An error occurred. Please try again.';
  }
  
  // Log full error server-side for debugging
  console.error('Auth error:', error);
  
  return throwError(() => new Error(errorMessage));
}
```

---

### 8. **Protected Routes**
```typescript
// Auth Guard - Always validate on navigation
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store intended URL for redirecting after login
  sessionStorage.setItem('returnUrl', state.url);
  router.navigate(['/sign-in']);
  return false;
};

// Usage in routes
{
  path: 'dashboard',
  canActivate: [authGuard],
  component: DashboardComponent
}
```

---

### 9. **Password Security**
```typescript
// Frontend
// - Enforce strong password requirements
// - Mask password field
// - Support password managers

// Backend (CRITICAL)
// - Hash passwords with bcrypt/scrypt (not MD5/SHA1)
// - Salt each password
// - Never store plaintext
// - Implement password strength requirements
// - Support password reset securely

// Example backend validation
const hashedPassword = await bcrypt.hash(password, 12);
// Store hashedPassword in database
```

---

### 10. **Session Management**
```typescript
// Auto-logout on token expiration
export class AuthService {
  private tokenCheckInterval: any;

  startTokenExpirationCheck(): void {
    this.tokenCheckInterval = setInterval(() => {
      const token = this.getToken();
      if (token && !this.isTokenValid(token)) {
        this.logout();
        // Notify user their session expired
      }
    }, 60000); // Check every minute
  }

  logout(): void {
    clearInterval(this.tokenCheckInterval);
    this.clearAuthData();
    this.router.navigate(['/sign-in']);
  }
}
```

---

### 11. **Logout Best Practices**
```typescript
logout(): void {
  // 1. Clear all tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // 2. Invalidate token on backend
  this.http.post(`${this.API_URL}/logout`, {}).subscribe(
    () => console.log('Token invalidated on server'),
    (error) => console.error('Logout error:', error)
  );

  // 3. Clear local state
  this.authState.next({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  // 4. Clear sensitive data from memory
  // (browsers do this automatically on page reload)

  // 5. Navigate to login
  this.router.navigate(['/sign-in']);
}
```

---

## API Configuration

### Backend Endpoints Required

```typescript
// Sign In
POST /api/auth/login
Body: { email: string, password: string }
Response: { accessToken: string, refreshToken?: string, user?: UserData }

// Sign Up
POST /api/auth/signup
Body: { email: string, password: string, firstName?: string, lastName?: string }
Response: { accessToken: string, refreshToken?: string, user?: UserData }

// Refresh Token
POST /api/auth/refresh
Body: { refreshToken: string }
Response: { accessToken: string, refreshToken?: string }

// Logout (Optional)
POST /api/auth/logout
Headers: { Authorization: 'Bearer <token>' }
Response: { success: boolean }

// Current User (Protected)
GET /api/auth/me
Headers: { Authorization: 'Bearer <token>' }
Response: UserData
```

### Environment Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000',  // Backend URL
  // Security settings
  tokenExpirationMinutes: 15,
  refreshTokenExpirationDays: 7,
  // Feature flags
  enableAutoTokenRefresh: true,
  enableSessionTimeout: true
};
```

---

## Component Architecture

### Components

#### 1. **SignInComponent** (`pages/sign-in/`)
- Email/Password login form
- OAuth buttons (Google, LinkedIn)
- Theme toggle
- Links to sign-up page

#### 2. **SignUpComponent** (`pages/sign-up/`)
- Registration form with password confirmation
- OAuth buttons
- Theme toggle
- Links to sign-in page

#### 3. **DashboardComponent** (`pages/dashboard/`)
- Protected route (requires authentication)
- Displays user info
- Logout button

### Services

#### 1. **AuthService** (`services/auth.service.ts`)
- Manages authentication state
- Handles login/signup/logout
- Token management and validation
- JWT decoding
- Auth state observables

#### 2. **ThemeService** (`services/theme.service.ts`)
- Manages theme preference
- Persists to localStorage
- Observable for reactive updates
- Auto-selects system preference

### Guards & Interceptors

#### 1. **AuthGuard** (`guards/auth.guard.ts`)
- Protects routes from unauthenticated access
- Checks `isAuthenticated()` before allowing navigation
- Redirects to login if not authenticated

#### 2. **AuthInterceptor** (`interceptors/auth.interceptor.ts`)
- Automatically adds JWT to Authorization header
- Handles token refresh on 401 errors
- Retries failed requests with new token

---

## Usage Examples

### Login

```typescript
// Template
<button (click)="onSubmit()" [disabled]="form.invalid">
  Sign In
</button>

// Component
onSubmit(): void {
  const credentials: LoginRequest = {
    email: this.form.get('email')?.value,
    password: this.form.get('password')?.value
  };

  this.authService.login(credentials).subscribe({
    next: (response) => {
      // Auto-navigated by component
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      this.errorMessage.set(error.message);
    }
  });
}
```

### Check Authentication Status

```typescript
// In component
isLoggedIn = this.authService.isAuthenticated();

authState$ = this.authService.authState$;

// In template
@if (authState$ | async as state) {
  @if (state.isAuthenticated) {
    <div>Welcome, {{ state.user?.email }}</div>
  } @else {
    <div>Please sign in</div>
  }
}
```

### Access User Data

```typescript
// Get current state
const state = this.authService.getAuthState();
console.log(state.user);
console.log(state.token);

// Get decoded token
const tokenData = this.authService.decodeToken();
console.log('Token expiration:', new Date(tokenData.exp * 1000));
```

### Toggle Theme

```html
<button (click)="themeService.toggleTheme()">
  Switch to {{ themeService.theme$() === 'dark' ? 'light' : 'dark' }} mode
</button>
```

---

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Sign-up with valid data succeeds
- [ ] Sign-up with duplicate email shows error
- [ ] Password confirmation validation works
- [ ] Protected routes redirect unauthenticated users
- [ ] Token persists after page refresh
- [ ] Theme preference persists after page refresh
- [ ] Token refresh works (if implemented)
- [ ] Logout clears all data
- [ ] XSS protection (validate all inputs)
- [ ] CSRF protection (verify backend setup)
- [ ] HTTPS in production

---

## Deployment Checklist

- [ ] Change API URL to production endpoint
- [ ] Implement HTTPOnly cookies for tokens
- [ ] Enable HTTPS for all API calls
- [ ] Configure CORS properly on backend
- [ ] Set secure cookie flags (Secure, SameSite)
- [ ] Implement rate limiting on auth endpoints
- [ ] Add request/response logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Implement password reset flow
- [ ] Add 2FA if required
- [ ] Review all security headers
- [ ] Audit dependencies for vulnerabilities

---

## Resources

- [JWT.io](https://jwt.io) - JWT explanation and debugger
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Angular Security Guide](https://angular.io/guide/security)
- [Angular HTTP Client](https://angular.io/guide/http)
- [Angular Interceptors](https://angular.io/guide/http#intercepting-requests-and-responses)
