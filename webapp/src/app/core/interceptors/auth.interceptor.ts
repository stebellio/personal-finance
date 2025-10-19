import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpStatusCode
} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {AuthService} from "../../auth/auth.service";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private readonly authService: AuthService) {}

  intercept(
      req: HttpRequest<any>,
      next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.includes('/auth/')) {
      return next.handle(req);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return next.handle(req);
    }

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(authReq).pipe(
        catchError(err => {
          if (err.status === HttpStatusCode.Unauthorized) {
            this.authService.logout()
          }
          return throwError(() => err);
        })
    );
  }
}
