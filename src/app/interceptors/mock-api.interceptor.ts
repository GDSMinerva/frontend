import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  constructor() {}

  /**
   * Intercepts HTTP requests to simulate a backend API.
   * If `environment.mockApi` is true, it checks for specific routes (like login/signup)
   * and handles them using data stored in `localStorage`.
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. Check if Mock API is enabled in environment settings
    // 2. Check if the request is targeting our API URL
    // If not, pass the request through to the real network handler
    if (!environment.mockApi || !request.url.startsWith(environment.apiUrl)) {
      return next.handle(request);
    }

    const { url, method, headers, body } = request;

    // Wrap logic in an Observable with delay to simulate real network latency
    return of(null).pipe(
      mergeMap(() => {
        // --- AUTHENTICATION ROUTES ---

        // Handle Login Request (POST /api/auth/login)
        if (url.endsWith('/login') && method === 'POST') {
          const { email, password } = body;
          
          // Retrieve users from LocalStorage (or empty array if none exist)
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          
          // Find user with matching credentials
          const user = users.find((u: any) => u.email === email && u.password === password);

          if (user) {
            // Success: Return 200 OK with fake tokens and user data (excluding password)
            const { password, ...userWithoutPassword } = user;
            return of(new HttpResponse({
              status: 200,
              body: {
                accessToken: 'mock-jwt-token-' + Date.now(),
                refreshToken: 'mock-refresh-token-' + Date.now(),
                user: userWithoutPassword
              }
            }));
          } else {
            // Failure: Return 401 Unauthorized
            return throwError(() => ({ error: { message: 'Invalid credentials' }, status: 401 }));
          }
        }

        // Handle Signup Request (POST /api/auth/signup)
        if (url.endsWith('/signup') && method === 'POST') {
          const { email, password, firstName, lastName } = body;
          
          // Retrieve existing users
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          
          // Check if email already exists
          if (users.find((u: any) => u.email === email)) {
            return throwError(() => ({ error: { message: 'User already exists' }, status: 400 }));
          }

          // Create new user object
          const newUser = {
            id: users.length + 1,
            email,
            password, // In a real app, this would be hashed!
            firstName,
            lastName,
            role: 'user',
            createdAt: new Date().toISOString()
          };

          // Save back to LocalStorage
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));

          const { password: _, ...userWithoutPassword } = newUser;

          // Return success response with tokens
          return of(new HttpResponse({
            status: 200,
            body: {
              accessToken: 'mock-jwt-token-' + Date.now(),
              refreshToken: 'mock-refresh-token-' + Date.now(),
              user: userWithoutPassword
            }
          }));
        }

        // --- OTHER ROUTES ---
        // If the request didn't match any of the above mocked routes,
        // we pass it through (or you could return 404).
        return next.handle(request);
      }),
      // Simulate network delay (e.g., 500ms)
      materialize(),
      delay(500),
      dematerialize()
    );
  }
}
