import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpStatusCode,
} from '@angular/common/http';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthService } from "../../auth/auth.service";
import { Router } from "@angular/router";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isAuthRoute(req.url)) {
      return next.handle(req);
    }

    const token = this.authService.getAccessToken();
    return next.handle(this.addToken(req, token)).pipe(
      catchError(err => {
        if (err.status === HttpStatusCode.Unauthorized) {
          return this.handle401(req, next);
        }
        return throwError(() => err);
      })
    );
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);

      return this.authService.refreshTokens().pipe(
        switchMap(tokens => {
          this.isRefreshing = false;
          this.refreshSubject.next(tokens.access_token);
          return next.handle(this.addToken(req, tokens.access_token));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
    }

    return this.refreshSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(req, token)))
    );
  }

  private addToken(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
    if (!token) {
      return req;
    }
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private isAuthRoute(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
  }
}
