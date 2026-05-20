import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, tap} from "rxjs";
import {environment} from "../../../environments/environment";
import {User} from "../core/models/user.model";
import {jwtDecode} from "jwt-decode";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private _user: User | null = null;

  constructor(private http: HttpClient) {
    this.loadUserFromToken();
  }

  get user(): User | null {
    return this._user;
  }

  login(email: string, password: string): Observable<TokenPair> {
    return this.http.post<TokenPair>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        this.storeTokens(response);
        this.loadUserFromToken();
      })
    );
  }

  register(email: string, password: string, name?: string) {
    return this.http.post(`${this.apiUrl}/auth/register`, { email, password, name });
  }

  refreshTokens(): Observable<TokenPair> {
    const refresh_token = this.getRefreshToken();
    return this.http.post<TokenPair>(`${this.apiUrl}/auth/refresh`, { refresh_token }).pipe(
      tap(response => this.storeTokens(response))
    );
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this._user = null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private storeTokens(tokens: TokenPair): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  private loadUserFromToken(): void {
    const token = this.getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        this._user = {
          id: decoded.id,
          email: decoded.email,
        };
      } catch {
        this._user = null;
      }
    }
  }
}
