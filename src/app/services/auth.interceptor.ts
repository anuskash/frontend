import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth endpoints
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
      return next.handle(req);
    }

    // Collect headers we want to attach
    const setHeaders: Record<string, string> = {};

    // Attach bearer token if present
    const localToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (localToken) {
      setHeaders['Authorization'] = `Bearer ${localToken}`;
    }

    // Always include userId header when we know the user
    const user = this.authService.getCurrentUser();
    if (user?.userId) {
      // Backend expects header key 'userId'
      setHeaders['userId'] = String(user.userId);
      // Keep the old header as well for any legacy endpoints
      setHeaders['X-User-Id'] = String(user.userId);
    }

    const cloned = Object.keys(setHeaders).length
      ? req.clone({ setHeaders })
      : req;

    return next.handle(cloned);
  }
}
