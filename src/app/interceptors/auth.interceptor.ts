import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Temporarily disabled - pass through without modification
    return next.handle(req);
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.refreshToken().pipe(
      switchMap((response) => {
        // Retry original request with new token
        const newToken = this.authService.getToken();
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        });

        return next.handle(req);
      }),
      catchError((error) => {
        // If refresh fails, logout and redirect to login
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}
